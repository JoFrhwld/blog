---
layout: post
title: "Non-linear modeling in stan"
comments: true
date: 2014-7-29 15:45:00 
author: [{name: "Joe", url: "jofrhwld.github.io"}]
---

Recently, there was [a pretty excellent post on the New York Times upshot blog](http://www.nytimes.com/interactive/2014/07/08/upshot/how-the-year-you-were-born-influences-your-politics.html) about how 
your date of birth affects your political orientation. It attributes the results to "a new model" written in
"new statistical software." When I looked at [the associated technical writeup](http://graphics8.nytimes.com/newsgraphics/2014/07/06/generations2/assets/cohort_voting_20140707.pdf), it was fun to see that it was
actually a Stan model! I used Stan quite a bit in my dissertation.

The technical writeup was pretty clear, as I've found most things Andrew Gelman's associated with to be.
It also utilized a method for doing non-linear modeling in Stan that hadn't occurred to me before.
For my dissertation, I used b-splines together with Stan to do non-linear modelling, but Ghitza & Gelman's approach is, I think, a bit easier to understand, and a bit more flexible. So, I thought I'd do a little writeup of how to do it.

The one requirement is that your continuous predictor needs to be quantizable. Fortunately for me, most of the
stuff I look at involves date of birth. In this example, I'll be using duration, which isn't exactly the best candidate, but the duration measurements here are drawn from FAVE-align, which only has a granularity of 10ms, so I'll be using 10ms increments as my quantized predictor.

More or less what you do is model the change in your outcome variable as you move from one point in your predictor to the next. In this example, I'm looking at how the normalized F1 of the word "I" changes as the vowel gets longer. So, if normalized F1 changes by 0.1 as the vowel goes from being 50ms long to 60ms long, we'd call the &delta; of 60ms 0.1. The predicted value of normalized F1 at any particular duration would then be the sum of all deltas up to that duration, plus an intercept term.


<pre><code class="prettyprint ">  intercept &lt;- 0.785
  deltas = c(0, 0.1,0.097, 0.096,0.089)
  durations = c(50,60,70,80,90)
  rbind(durs = durations,
        deltas = deltas,
        cumsum_deltas = cumsum(deltas),
        time_mu  = cumsum(deltas) + intercept )</code></pre>



<pre><code>##                 [,1]   [,2]   [,3]   [,4]   [,5]
## durs          50.000 60.000 70.000 80.000 90.000
## deltas         0.000  0.100  0.097  0.096  0.089
## cumsum_deltas  0.000  0.100  0.197  0.293  0.382
## time_mu        0.785  0.885  0.982  1.078  1.167
</code></pre>

This is conceptually similar to how normal linear regression works. If you constrain the &delta; of every duration to be the same, you're going to end up with just a straight line.

We'd expect that the &delta; of any particular duration wouldn't be exceptionally different from the &delta; of the previous duration. Putting that in statistical terms, we'll say that 
&delta;<sub>i</sub> ~ normal(&delta;<sub>i-1</sub>, &sigma;<sub>&delta;</sub>). As &sigma;<sub>&delta;</sub> gets larger, &delta;<sub>i</sub> could be more exceptionally different from &delta;<sub>i-1</sub>.

That's more or less the basics of it. Here's how to implement that in Stan. To play along here, you'll need to get [Stan](http://mc-stan.org/) and [rstan](http://mc-stan.org/rstan.html) appropriately installed. In this example, I'll also be using plyr, dplyr, and ggplot2.



<pre><code class="prettyprint ">library(plyr)
library(dplyr)
library(rstan)
library(ggplot2)</code></pre>

Here's the data. It's measurements of one person's (pseudonymously "Jean") production of "I" and contractions of "I".


<pre><code class="prettyprint ">  I_jean &lt;- read.delim(&quot;http://jofrhwld.github.io/data/I_jean.txt&quot;)
  head(I_jean)</code></pre>



<pre><code>##    Name Age Sex Word FolSegTrans Dur_msec     F1   F2   F1.n    F2.n
## 1 Jean   61   f  I'M           M      130  861.7 1336 1.6609 -0.8855
## 2 Jean   61   f    I           N      140 1010.4 1349 2.6883 -0.8536
## 3 Jean   61   f I'LL           L      110  670.1 1293 0.3370 -0.9873
## 4 Jean   61   f  I'M           M      180  869.8 1307 1.7168 -0.9536
## 5 Jean   61   f    I           R       80  743.0 1419 0.8407 -0.6897
## 6 Jean   61   f I'VE           V      120  918.2 1581 2.0512 -0.3068
</code></pre>


Here's the Stan model code. It consists of four program blocks (data, parameters, transformed parameters, and model), and I've included in-line comments to explain bits of it. If you're more familiar with other Monte Carlo software, you'll notice I haven't defined priors for some of the declared parameters. That's because a declaration of `real<lower=0, upper=100>` effecively defines a uniform prior between 0 and 100.


<pre><code class="prettyprint ">model_code &lt;- '
  data{
    int&lt;lower=0&gt; N; // number of observations
    real y[N];      // the outcome variable
    
    int&lt;lower=0&gt; max_time;  // the largest time index
    int&lt;lower=0&gt; max_word;  // the largest word index
  
    int&lt;lower=0&gt; time[N];    // the time explanatory variable
    int&lt;lower=0&gt; word_id[N]; // the word explanatory variable
  }

  parameters{
    // more or less (1|word) in lmer terms
    vector[max_word] word_effects;

    // scaling parameters for sampling 
    real&lt;lower=0, upper=100&gt; word_sigma;  
    real&lt;lower=0, upper=100&gt; sigma;

    // Ghitza &amp; Gelman used normal(delta[i-1],1) for sampling deltas,
    // but in some other work I found this led to overfitting for my data.
    // So, Im using this hyperprior. 
    real&lt;lower=0, upper=100&gt; delta_sigma;

    // time_deltas is shorter than max_time,
    // because the first delta logically 
    // has to be 0.
    vector[max_time-1] time_deltas;

    real intercept;
  }
  transformed parameters{
    // time_mu will be the expected
    // F1 at each time point
    vector[max_time] time_mu;
    
    // real_deltas is just time_deltas 
    // with 0 concatenated to the front
    vector[max_time] real_deltas;

   
    real_deltas[1] &lt;- 0.0;
    for(i in 1:(max_time-1)){
      real_deltas[i+1] &lt;- time_deltas[i];
    }

    // The cumulative sum of deltas, plus
    // the initial value (intercept) equals
    // the expected F1 at that time index
    time_mu &lt;- cumulative_sum(real_deltas) + intercept;    
  }
  model{
    // this y_hat variable is to allow
    // for vectorized sampling from normal().
    // Sampling is just quicker this way.
    vector[N] y_hat;

    // The first time_delta should be less constrained
    // than the rest. delta_sigma could be very small,
    // and if so, the subsequent delta values would be
    // constrained to be too close to 0.
    time_deltas[1] ~ normal(0, 100);
    for(i in 2:(max_time-1)){
        time_deltas[i] ~ normal(time_deltas[i-1], delta_sigma);
    }
    
    intercept ~ normal(0, 100);
    
    // this is vectorized sampling for all of the
    // word effects.
    word_effects ~ normal(0, word_sigma);
    
    // This loop creates the expected 
    // values of y, from the model
    for(i in 1:N){
      y_hat[i] &lt;- time_mu[time[i]] + word_effects[word_id[i]];
    }

    // this is equivalent to;
    // y[i] &lt;- time_mu[time[i]] + word_effects[word_id[i]] + epsilon[i];
    // epsilon[i] ~ normal(0, sigma);
    y ~ normal(y_hat, sigma);
  }
'</code></pre>

To fit the model, we need to do some adjustments to the data. For example, we need to convert the duration measurements (which currently increment like 50, 60, 70, 80... ) into indices starting at 1, and incrementing like 1, 2, 3, 5, etc. We also need to convert the word labels into numeric indices.


<pre><code class="prettyprint ">mod_data &lt;- I_jean %&gt;%
              mutate(Dur1 = round(((Dur_msec-min(Dur_msec))/10)+1),
                     wordN = as.numeric(as.factor(Word)))</code></pre>

rstan takes its data input as a list, so here we create the list, and fit the model with 3 chains, 1000 iterations per chain. By default, the first half of the iterations will be discarded as the burn-in.

<pre><code class="prettyprint ">data_list &lt;- list(N = nrow(mod_data),
                  y = mod_data$F1.n,
                  max_time = max(mod_data$Dur1),
                  max_word = max(mod_data$wordN),
                  time = mod_data$Dur1,
                  word_id = mod_data$wordN)


mod &lt;- stan(model_code = model_code, data = data_list, chains = 3, iter = 1000)</code></pre>



<pre><code>## 
## TRANSLATING MODEL 'model_code' FROM Stan CODE TO C++ CODE NOW.
## COMPILING THE C++ CODE FOR MODEL 'model_code' NOW.
## 
## SAMPLING FOR MODEL 'model_code' NOW (CHAIN 1).
## 
## Iteration:   1 / 1000 [  0%]  (Warmup)
## Iteration: 100 / 1000 [ 10%]  (Warmup)
## Iteration: 200 / 1000 [ 20%]  (Warmup)
## Iteration: 300 / 1000 [ 30%]  (Warmup)
## Iteration: 400 / 1000 [ 40%]  (Warmup)
## Iteration: 500 / 1000 [ 50%]  (Warmup)
## Iteration: 501 / 1000 [ 50%]  (Sampling)
## Iteration: 600 / 1000 [ 60%]  (Sampling)
## Iteration: 700 / 1000 [ 70%]  (Sampling)
## Iteration: 800 / 1000 [ 80%]  (Sampling)
## Iteration: 900 / 1000 [ 90%]  (Sampling)
## Iteration: 1000 / 1000 [100%]  (Sampling)
## #  Elapsed Time: 1.1518 seconds (Warm-up)
## #                0.777117 seconds (Sampling)
## #                1.92892 seconds (Total)
## 
## 
## SAMPLING FOR MODEL 'model_code' NOW (CHAIN 2).
## 
## Iteration:   1 / 1000 [  0%]  (Warmup)
## Iteration: 100 / 1000 [ 10%]  (Warmup)
## Iteration: 200 / 1000 [ 20%]  (Warmup)
## Iteration: 300 / 1000 [ 30%]  (Warmup)
## Iteration: 400 / 1000 [ 40%]  (Warmup)
## Iteration: 500 / 1000 [ 50%]  (Warmup)
## Iteration: 501 / 1000 [ 50%]  (Sampling)
## Iteration: 600 / 1000 [ 60%]  (Sampling)
## Iteration: 700 / 1000 [ 70%]  (Sampling)
## Iteration: 800 / 1000 [ 80%]  (Sampling)
## Iteration: 900 / 1000 [ 90%]  (Sampling)
## Iteration: 1000 / 1000 [100%]  (Sampling)
## #  Elapsed Time: 0.916265 seconds (Warm-up)
## #                0.68692 seconds (Sampling)
## #                1.60318 seconds (Total)
## 
## 
## SAMPLING FOR MODEL 'model_code' NOW (CHAIN 3).
## 
## Iteration:   1 / 1000 [  0%]  (Warmup)
## Iteration: 100 / 1000 [ 10%]  (Warmup)
## Iteration: 200 / 1000 [ 20%]  (Warmup)
## Iteration: 300 / 1000 [ 30%]  (Warmup)
## Iteration: 400 / 1000 [ 40%]  (Warmup)
## Iteration: 500 / 1000 [ 50%]  (Warmup)
## Iteration: 501 / 1000 [ 50%]  (Sampling)
## Iteration: 600 / 1000 [ 60%]  (Sampling)
## Iteration: 700 / 1000 [ 70%]  (Sampling)
## Iteration: 800 / 1000 [ 80%]  (Sampling)
## Iteration: 900 / 1000 [ 90%]  (Sampling)
## Iteration: 1000 / 1000 [100%]  (Sampling)
## #  Elapsed Time: 0.926489 seconds (Warm-up)
## #                0.771759 seconds (Sampling)
## #                1.69825 seconds (Total)
</code></pre>

rstan has a nice summary function for its models, which includes the Rubin-Gelman Convergence diagnostic. It looks like this model is well converged, with all parameters having an Rhat very close to 1.


<pre><code class="prettyprint ">  mod_summary &lt;- as.data.frame(summary(mod)$summary)
  ggplot(mod_summary, aes(Rhat)) +
    geom_bar()</code></pre>



<pre><code>## stat_bin: binwidth defaulted to range/30. Use 'binwidth = x' to adjust this.
</code></pre>



<pre><code>## Warning: position_stack requires constant width: output may be incorrect
</code></pre>

<img src="/blog/figs/2014-7-29-nonlinear_stanunnamed-chunk-7.svg" title="center" alt="center" style="display: block; margin: auto;" />

I also think rstan's `traceplot()` has an attractive color palette. These two traceplots show the posterior samples of `sigma`. The first one includes the burn-in, and the second one excludes it.


<pre><code class="prettyprint ">traceplot(mod, &quot;sigma&quot;)</code></pre>

<img src="/blog/figs/2014-7-29-nonlinear_stanunnamed-chunk-8.svg" title="center" alt="center" style="display: block; margin: auto;" />


<pre><code class="prettyprint ">traceplot(mod, &quot;sigma&quot;, inc_warmup = F)</code></pre>

<img src="/blog/figs/2014-7-29-nonlinear_stanunnamed-chunk-9.svg" title="center" alt="center" style="display: block; margin: auto;" />

This is a function that I wrote to extract summaries of specific parameters from the model.
I wrote it while I was writing my dissertation, so I can't actually parse it right now, but
it gets the job done nicely.


<pre><code class="prettyprint ">extract_from_summary &lt;- function(summary = NULL, pars){
  library(stringr)
  library(plyr)
  
  pars &lt;- paste(paste(&quot;^&quot;, pars, sep = &quot;&quot;), collapse = &quot;|&quot;)
  if(class(summary) == &quot;matrix&quot;){
    summary.df &lt;- as.data.frame(summary)[grepl(pars, row.names(summary)),]
  }else{
    summary.df &lt;- summary[grepl(pars, row.names(summary)),]
  }
  
  summary.df$full_pars &lt;- row.names(summary.df)
  summary.df$pars &lt;- gsub(&quot;\\[.*\\]&quot;, &quot;&quot;, summary.df$full_pars)
  
  dim_cols &lt;- ldply(
    llply(
      llply(
        str_split(
          gsub(&quot;\\[|\\]&quot;,&quot;&quot;,
               str_extract(summary.df$full_pars, &quot;\\[.*\\]&quot;)
          ),
          &quot;,&quot;), 
        as.numeric),
      rbind), 
    as.data.frame)
  
  summary.df &lt;- cbind(summary.df, dim_cols)
  
  return(summary.df)
  
}</code></pre>


So first, here's a plot of the `time_delta` variable, with 95% credible intervals. I've also included a horizontal line at 0, so we can more easilly see when the rate of change isn't reliably different from 0.

<pre><code class="prettyprint ">extract_from_summary(summary(mod)$summary, &quot;time_delta&quot;)%&gt;%
    ggplot(., aes(((V1)*10)+50, mean)) + 
    geom_hline(y=0, color = &quot;grey50&quot;)+
    geom_line()+
    geom_ribbon(aes(ymin = `2.5%`, ymax = `97.5%`), alpha = 0.3)+
    xlab(&quot;Duration (msec)&quot;)+
    scale_y_reverse(&quot;time delta&quot;)</code></pre>

<img src="/blog/figs/2014-7-29-nonlinear_stanunnamed-chunk-11.svg" title="center" alt="center" style="display: block; margin: auto;" />

Already, this is pretty cool. I made a fuss in my dissertation about how important the rate of change can be important for understanding language change. At the time, I was stuck with the smoothers I understood, which meant pre-specifying how wobbly the &delta; curve could be. Using this method, it could be arbitrarilly wobbly, but still fairly smooth. 

Next, here's `time_mu`, which is the expected normalized F1 at different durations with 95% credible intervals. I've also plotted the original data points on here, so it looks like most plots + smooths out there.


<pre><code class="prettyprint ">extract_from_summary(summary(mod)$summary, &quot;time_mu&quot;)%&gt;%
    ggplot(., aes(((V1-1)*10)+50, mean)) + 
    geom_point(data = I_jean, aes(Dur_msec, F1.n), alpha = 0.7)+
    geom_line()+
    geom_ribbon(aes(ymin = `2.5%`, ymax = `97.5%`), alpha = 0.2)+
    xlab(&quot;Duration (msec)&quot;)+
    scale_y_reverse(&quot;time mu&quot;)</code></pre>

<img src="/blog/figs/2014-7-29-nonlinear_stanunnamed-chunk-12.svg" title="center" alt="center" style="display: block; margin: auto;" />

Pretty good, huh? Here's a direct comparison of the smooth from Stan, and a loess smooth.


<pre><code class="prettyprint ">extract_from_summary(summary(mod)$summary, &quot;time_mu&quot;)%&gt;%
    ggplot(., aes(((V1-1)*10)+50, mean)) + 
    geom_line(color = &quot;red3&quot;)+
    geom_ribbon(aes(ymin = `2.5%`, ymax = `97.5%`), alpha = 0.3, fill = &quot;red3&quot;)+
    stat_smooth(data = I_jean, aes(Dur_msec, F1.n), 
                color= &quot;blue3&quot;, 
                fill = &quot;blue3&quot;,method = &quot;loess&quot;)+
    xlab(&quot;Duration (msec)&quot;)+
    scale_y_reverse(&quot;time mu&quot;)</code></pre>

<img src="/blog/figs/2014-7-29-nonlinear_stanunnamed-chunk-13.svg" title="center" alt="center" style="display: block; margin: auto;" />

So, the Stan model has broader itervals than the loess smooth, but that makes a lot of sense, since there is uncertainty in the estimate of each &delta;, and that uncertainty will accumulate across the cumulative sum of all &delta;s. The uncertainty isn't necessarilly greater towards the end of the range of the predictor. It's just that way here because there isn't that much data in the longer durations. In other models I've fit like this, the uncertainty flares out at the beginning and the end of the predictor's range in the normal way.

And just for fun, here's a plot of the estimated word effects. 


<pre><code class="prettyprint ">word_effects &lt;- extract_from_summary(summary(mod)$summary, &quot;word_effects&quot;) %&gt;%
                  mutate(word = levels(mod_data$Word)[V1])

ggplot(word_effects, aes(word, mean)) + 
    geom_hline(y=0,color = &quot;grey50&quot;)+
    geom_pointrange(aes(ymin = `2.5%`, ymax = `97.5%`))+
    coord_flip()</code></pre>

<img src="/blog/figs/2014-7-29-nonlinear_stanunnamed-chunk-14.svg" title="center" alt="center" style="display: block; margin: auto;" />

None of their 95% credible intervals exclude 0.



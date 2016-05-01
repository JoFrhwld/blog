---
layout: post
title: "Individual Differences and Fitting Many Models"
comments: true
date: 2016-05-01 15:44:48
author: [{name: "Joe", url: "jofrhwld.github.io"}]
---

Today I went to Hadley Wickham's talk to the EdinbR users' group called [Managing Many Models in R](http://edinbr.org/edinbr/2016/04/24/april-Hadley-Update.html).
It highlighted some workflows for cleanly fitting many models to subsets of a data set, then comparing across model fits
I thought I'd experiment by applying them to some linguistic data that I'm familiar with.

### TD Deletion

Very briefly, "TD Deletion", as I'm calling it, is a process common to every variety of English where a word final /t/ or /d/ in a cluster is deleted. 
Some example words are:

|Word | Deleted |
| ---- | ------ |
| *mist* | *mis'* |
| *kept* | *kep'* |
| *missed* | *miss'*|

It's more common in words where the /t d/ is just part of the word, like *mist* than in words where it's part of the past tense marker, like *missed*. 
In the data, the *mist* case is labeled `mono` for "monomorpheme" and the *missed* case is labeled `past`.



## Setup

The TD Deletion data I'm using is derived from [The Buckeye Corpus](http://buckeyecorpus.osu.edu), and is available in the `grammarOfVariatonData` package.

<pre><code class="prettyprint ">  library(devtools)
  if(!require(&quot;grammarOfVariationData&quot;)){
    install_github(&quot;jofrhwld/grammarOfVariationData&quot;)  
    library(grammarOfVariationData)
  }</code></pre>

The functions in these workflows come from what some call the "Hadleyverse", but he's not the primary author of two of these packages (`broom` and `magrittr`). 
When I'm using functions from these packages, I'll use the `package::function()` notation so it's clear which functions come from which package, but in normal practice, you probably won't need to include the `package::` part yourself.


<pre><code class="prettyprint ">  library(dplyr)
  library(purrr)
  library(broom)
  library(tidyr)
  library(magrittr)
  library(ggplot2)</code></pre>

I'll also be fitting some more standard mixed effects models for comparison sake.

<pre><code class="prettyprint ">  library(lme4)</code></pre>

## The Plan

I'll be looking at two factors that seem to have an influence on the rate of TD Deletion 

1. Speech Rate
2. Word Frequency

Specifically, I'm going to see if there are any meaningful individual differences between how individual speakers are affected by these factors.

## The Original Data

This is a subset of columns from the full Buckeye TD deletion data. 


<pre><code class="prettyprint ">  buckeye %&gt;%
    dplyr::select(Speaker, Word, seg, DictRate, Gram2, td)%&gt;%
    head()</code></pre>



<pre><code>##   Speaker     Word seg DictRate Gram2 td
## 1     s01    lived   d 6.036144  past  1
## 2     s01      and   d 6.182479   and  0
## 3     s01   raised   d 6.431375  past  1
## 4     s01     west   t 4.227088  mono  0
## 5     s01     kind   d 6.612163  mono  0
## 6     s01 received   d 4.600222  past  1
</code></pre>

`DictRate` corresponds to how many syllables per second there were in an 8 word window surrounding the target word, based on cannonical pronunciations.
`td` is the outcome measure, and has a value of `1` if the /t d/ was pronounced and a value of `0` if it wasn't.

## Rate of Speech

`DictRate` is heavily leftward skewed, with some extremely (implausibly) high syllable per second rates.
Things look more plausible if we exclude data where the target word was not right or left aligned with the window in which speech rate was estimated.
So, we'll use this subset for the speech rate modeling.

<div style = "width:100%;">
<div style = "float:left;width:50%">

<pre><code class="prettyprint ">  buckeye %&gt;%
    ggplot(aes(DictRate))+
      geom_density()</code></pre>

<img src="/figs/many_modelsdictrate_plot-1.svg" title="center" alt="center" width="100%" />
</div>
<div style = "float:left;width:50%">

<pre><code class="prettyprint ">  buckeye %&gt;% filter(PreWindow &gt; 1 | PostWindow &gt; 1 ) %&gt;%
    ggplot(aes(DictRate))+
      geom_density()</code></pre>

<img src="/figs/many_modelsdictrate_plot2-1.svg" title="center" alt="center" width="100%" />
</div>
</div>

### Nesting the data

Step 1 is to create a data frame of data frames.
First, let's select the rows and columns of the full dataset we want to use.


<pre><code class="prettyprint ">  rate_to_use &lt;- buckeye %&gt;%
                  dplyr::filter(PreWindow &gt; 1 | PostWindow &gt; 1,
                                Gram2 %in% c(&quot;past&quot;, &quot;mono&quot;)) %&gt;%
                  dplyr::mutate(RateCenter = DictRate - median(DictRate)) %&gt;%
                  dplyr::select(Speaker, Word, RateCenter, Gram2, td)</code></pre>

I want to fit 1 model for each speaker for each grammatical class (past tense or monomorpheme), so I need to group this data frame by `Speaker` and `Gram2`.
Then, I'll use `nest()` to create a new column that contains a data frame with the remaining columns.


<pre><code class="prettyprint ">  rate_nest &lt;- rate_to_use %&gt;%
                  dplyr::group_by(Speaker, Gram2) %&gt;%
                  tidyr::nest()</code></pre>

Here's what the data frame of data frames looks like:


<pre><code class="prettyprint ">  rate_nest</code></pre>



<pre><code>## Source: local data frame [76 x 3]
## 
##    Speaker  Gram2             data
##     (fctr) (fctr)            (chr)
## 1      s01   past  &lt;tbl_df [58,3]&gt;
## 2      s01   mono &lt;tbl_df [171,3]&gt;
## 3      s02   mono &lt;tbl_df [218,3]&gt;
## 4      s02   past  &lt;tbl_df [46,3]&gt;
## 5      s03   mono &lt;tbl_df [219,3]&gt;
## 6      s03   past  &lt;tbl_df [56,3]&gt;
## 7      s04   mono &lt;tbl_df [240,3]&gt;
## 8      s04   past  &lt;tbl_df [41,3]&gt;
## 9      s05   mono &lt;tbl_df [184,3]&gt;
## 10     s05   past  &lt;tbl_df [38,3]&gt;
## ..     ...    ...              ...
</code></pre>

Here's what the first item in the `data` column looks like.

<pre><code class="prettyprint ">  rate_nest$data[[1]]</code></pre>



<pre><code>## Source: local data frame [58 x 3]
## 
##         Word RateCenter    td
##       (fctr)      (dbl) (int)
## 1      lived  0.8881393     1
## 2     raised  1.2833697     1
## 3   received -0.5477829     1
## 4  sustained  0.4536305     1
## 5      moved -1.1036793     1
## 6   involved  0.3295448     1
## 7   involved  3.3815070     1
## 8     looked -3.4224800     1
## 9   informed -1.5658356     1
## 10   watched  0.7513170     1
## ..       ...        ...   ...
</code></pre>


### Fitting the models
The next step is to write a little function that takes one of our small data frames as input, and will produce a model as an output.


<pre><code class="prettyprint ">  fit_one_rate_mod &lt;- function(data){
    mod &lt;- glm(td ~ RateCenter , data = data, family = binomial)
    return(mod)
  }</code></pre>

Here's what happens when we pass just one of our smaller data frames to `fit_one_rate_mod`.

<pre><code class="prettyprint ">  fit_one_rate_mod(rate_nest$data[[1]])</code></pre>



<pre><code>## 
## Call:  glm(formula = td ~ RateCenter, family = binomial, data = data)
## 
## Coefficients:
## (Intercept)   RateCenter  
##     1.35381      0.02941  
## 
## Degrees of Freedom: 57 Total (i.e. Null);  56 Residual
## Null Deviance:	    59.14 
## Residual Deviance: 59.12 	AIC: 63.12
</code></pre>

But what we want to do is apply `fit_one_rate_mod` to *all* of the nested data frames.
For this, we an use the `purrr::map()` function. 
It takes a list as its first argument, and a function as its second argument.
It then applies that function to every item in the list.


<pre><code class="prettyprint ">  rate_nest &lt;- rate_nest %&gt;%
                 dplyr::mutate(mod = purrr::map(data, fit_one_rate_mod))

  rate_nest</code></pre>



<pre><code>## Source: local data frame [76 x 4]
## 
##    Speaker  Gram2             data          mod
##     (fctr) (fctr)            (chr)        (chr)
## 1      s01   past  &lt;tbl_df [58,3]&gt; &lt;S3:glm, lm&gt;
## 2      s01   mono &lt;tbl_df [171,3]&gt; &lt;S3:glm, lm&gt;
## 3      s02   mono &lt;tbl_df [218,3]&gt; &lt;S3:glm, lm&gt;
## 4      s02   past  &lt;tbl_df [46,3]&gt; &lt;S3:glm, lm&gt;
## 5      s03   mono &lt;tbl_df [219,3]&gt; &lt;S3:glm, lm&gt;
## 6      s03   past  &lt;tbl_df [56,3]&gt; &lt;S3:glm, lm&gt;
## 7      s04   mono &lt;tbl_df [240,3]&gt; &lt;S3:glm, lm&gt;
## 8      s04   past  &lt;tbl_df [41,3]&gt; &lt;S3:glm, lm&gt;
## 9      s05   mono &lt;tbl_df [184,3]&gt; &lt;S3:glm, lm&gt;
## 10     s05   past  &lt;tbl_df [38,3]&gt; &lt;S3:glm, lm&gt;
## ..     ...    ...              ...          ...
</code></pre>



<pre><code class="prettyprint ">  rate_nest$mod[[1]]</code></pre>



<pre><code>## 
## Call:  glm(formula = td ~ RateCenter, family = binomial, data = data)
## 
## Coefficients:
## (Intercept)   RateCenter  
##     1.35381      0.02941  
## 
## Degrees of Freedom: 57 Total (i.e. Null);  56 Residual
## Null Deviance:	    59.14 
## Residual Deviance: 59.12 	AIC: 63.12
</code></pre>

### Tidy model summaries
In our nested data frame, we now have a coulum which contains a logistic regression model for each speaker for each grammatical class.
In order to to do anything meaningful now, we need to extract important information from each model, ideally storing it again in another data frame.
Here's where `broom::glance()` and `broom::tidy()` come in.
`glance()` will produce a one line summary for the entire model, and `tidy()` will produce a summary of the model coefficients.


<pre><code class="prettyprint ">  broom::glance(rate_nest$mod[[1]])</code></pre>



<pre><code>##   null.deviance df.null   logLik      AIC      BIC deviance df.residual
## 1      59.13862      57 -29.5594 63.11879 67.23968 59.11879          56
</code></pre>



<pre><code class="prettyprint ">  broom::tidy(rate_nest$mod[[1]])</code></pre>



<pre><code>##          term   estimate std.error statistic      p.value
## 1 (Intercept) 1.35381379 0.3329521 4.0660918 0.0000478081
## 2  RateCenter 0.02941017 0.2086622 0.1409463 0.8879123804
</code></pre>

What we'll do is apply `broom::tidy()` to each model, again using `purr::map()`, and extract how many data points each model was fit with.
Then, with `tidyr::unnest()`, we'll pop this out into a free-standing data frame.


<pre><code class="prettyprint ">  rate_nest &lt;- rate_nest %&gt;%
                 dplyr::mutate(tidy = purrr::map(mod, broom::tidy),
                               n = purrr::map(data, nrow) %&gt;% simplify())

  rate_nest</code></pre>



<pre><code>## Source: local data frame [76 x 6]
## 
##    Speaker  Gram2             data          mod               tidy     n
##     (fctr) (fctr)            (chr)        (chr)              (chr) (int)
## 1      s01   past  &lt;tbl_df [58,3]&gt; &lt;S3:glm, lm&gt; &lt;data.frame [2,5]&gt;    58
## 2      s01   mono &lt;tbl_df [171,3]&gt; &lt;S3:glm, lm&gt; &lt;data.frame [2,5]&gt;   171
## 3      s02   mono &lt;tbl_df [218,3]&gt; &lt;S3:glm, lm&gt; &lt;data.frame [2,5]&gt;   218
## 4      s02   past  &lt;tbl_df [46,3]&gt; &lt;S3:glm, lm&gt; &lt;data.frame [2,5]&gt;    46
## 5      s03   mono &lt;tbl_df [219,3]&gt; &lt;S3:glm, lm&gt; &lt;data.frame [2,5]&gt;   219
## 6      s03   past  &lt;tbl_df [56,3]&gt; &lt;S3:glm, lm&gt; &lt;data.frame [2,5]&gt;    56
## 7      s04   mono &lt;tbl_df [240,3]&gt; &lt;S3:glm, lm&gt; &lt;data.frame [2,5]&gt;   240
## 8      s04   past  &lt;tbl_df [41,3]&gt; &lt;S3:glm, lm&gt; &lt;data.frame [2,5]&gt;    41
## 9      s05   mono &lt;tbl_df [184,3]&gt; &lt;S3:glm, lm&gt; &lt;data.frame [2,5]&gt;   184
## 10     s05   past  &lt;tbl_df [38,3]&gt; &lt;S3:glm, lm&gt; &lt;data.frame [2,5]&gt;    38
## ..     ...    ...              ...          ...                ...   ...
</code></pre>



<pre><code class="prettyprint ">  rate_coefs &lt;- rate_nest %&gt;%
                  tidyr::unnest(tidy) %&gt;%
                  dplyr::select(-(std.error:p.value)) %&gt;%
                  tidyr::spread(term, estimate)
  
  rate_coefs</code></pre>



<pre><code>## Source: local data frame [76 x 5]
## 
##    Speaker  Gram2     n (Intercept)  RateCenter
##     (fctr) (fctr) (int)       (dbl)       (dbl)
## 1      s01   mono   171   0.3109309 -0.08511930
## 2      s01   past    58   1.3538138  0.02941017
## 3      s02   mono   218   0.2834635 -0.30801155
## 4      s02   past    46   0.3795177 -0.04756514
## 5      s03   mono   219  -0.3751245 -0.42651949
## 6      s03   past    56   0.1228607 -0.34137119
## 7      s04   mono   240  -0.7632547 -0.22761177
## 8      s04   past    41   0.8512747 -0.18682255
## 9      s05   mono   184   0.8195723 -0.14171049
## 10     s05   past    38   1.5298129 -0.64609481
## ..     ...    ...   ...         ...         ...
</code></pre>

### The Results

Now it's just a matter of plotting it out.


<pre><code class="prettyprint ">  rate_coefs%&gt;%
    ggplot(aes(`(Intercept)`, RateCenter, color = Gram2))+
      geom_point(aes(size = n), alpha = 0.6)+
      scale_size_area()+
      coord_fixed()</code></pre>

![center]({{site.baseurl}}/figs/many_modelsrate_plot-1.svg)

It looks like the predicted effect that as speech rate increases, /t d/ retention decreases is held up. Most of the points for each speaker are below 0.
There is a fair bit of inter-speaker variation in their baseline rate of /t d/ retention (along the x axis), but much less for the rate of speech effect, and there seems to be very little relationship between the two.
That is, most speakers are likely react in a very similar way to increasing the rate of speech, regardless of whether they have a high or low baseline rate of /t d/ retention.

Let's look at how this would all shake out in a normal mixed-effects model:


<pre><code class="prettyprint ">  rate_data &lt;- rate_nest%&gt;%unnest(data)
  
  rate_mod &lt;- glmer(td ~ RateCenter*Gram2 + (RateCenter|Speaker) + (1|Word),
               data = rate_data,
               family = binomial)
  
  summary(rate_mod)</code></pre>



<pre><code>## Generalized linear mixed model fit by maximum likelihood (Laplace
##   Approximation) [glmerMod]
##  Family: binomial  ( logit )
## Formula: td ~ RateCenter * Gram2 + (RateCenter | Speaker) + (1 | Word)
##    Data: rate_data
## 
##      AIC      BIC   logLik deviance df.resid 
##  12846.1  12904.8  -6415.0  12830.1    11359 
## 
## Scaled residuals: 
##     Min      1Q  Median      3Q     Max 
## -7.4473 -0.6971  0.3012  0.6463  4.0799 
## 
## Random effects:
##  Groups  Name        Variance Std.Dev. Corr 
##  Word    (Intercept) 1.044249 1.02189       
##  Speaker (Intercept) 0.255016 0.50499       
##          RateCenter  0.002359 0.04857  -0.03
## Number of obs: 11367, groups:  Word, 1000; Speaker, 38
## 
## Fixed effects:
##                      Estimate Std. Error z value Pr(&gt;|z|)    
## (Intercept)           0.74630    0.10817   6.900 5.21e-12 ***
## RateCenter           -0.17929    0.01742 -10.294  &lt; 2e-16 ***
## Gram2past             0.67300    0.11483   5.861 4.61e-09 ***
## RateCenter:Gram2past  0.08665    0.03441   2.518   0.0118 *  
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
## 
## Correlation of Fixed Effects:
##             (Intr) RtCntr Grm2ps
## RateCenter  -0.010              
## Gram2past   -0.363  0.002       
## RtCntr:Grm2  0.001 -0.356  0.002
</code></pre>

Looks mostly like we'd expect given the speaker-level modelling. 
The fixed effect of speech rate is negative, meaning a higher rate of speech has a higher rate of deletion.
Looking at the random effects, we see a larger standard deviation for speaker-level intercepts than for speaker-level speech rate effects, just like in the figure above, and they are very weakly correlated.


## Frequency Effects

Let's do the same thing for frequency effects. 
I'll be using word frequency norms from [SUBTLEX-US](http://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexus/overview.htm), specifically a centered version of the [Zipf Scale](http://crr.ugent.be/archives/1352).

I'm going to compress this down into as few lines as possible just to show off the power of the workflow.


<pre><code class="prettyprint ">  subtlex &lt;- read.delim(&quot;../data/subtlex/SUBTLEXus74286wordstextversion-3.txt&quot;)

  # This is just transforming and centering the frequency data for modelling.
  # It's important to center the frequencies over word types in this way.
  zipf_scores &lt;- subtlex %&gt;%
                  dplyr::mutate(Word = tolower(Word),
                                zipf = log10(SUBTLWF)) %&gt;%
                  dplyr::select(Word, zipf) %&gt;%
                  dplyr::semi_join(buckeye %&gt;% 
                                      mutate(Word = tolower(Word)) %&gt;%
                                      filter(Gram2 %in% c(&quot;past&quot;, &quot;mono&quot;))) %&gt;%
                  dplyr::mutate(zipf_center = zipf - median(zipf))</code></pre>



<pre><code>## Joining by: &quot;Word&quot;
</code></pre>



<pre><code class="prettyprint ">  # getting the subset of the data to use for analysis
  freq_to_use &lt;- buckeye%&gt;%
                  dplyr::filter(Gram2 %in% c(&quot;past&quot;, &quot;mono&quot;))%&gt;%
                  dplyr::mutate(Word = tolower(Word))%&gt;%
                  dplyr::left_join(zipf_scores)%&gt;%
                  dplyr::select(Speaker, Word, zipf_center, Gram2, td)</code></pre>



<pre><code>## Joining by: &quot;Word&quot;
</code></pre>



<pre><code class="prettyprint ">  # The model fitting function
  fit_one_freq_mod &lt;- function(data){
    mod &lt;- glm(td ~ zipf_center, data = data, family = binomial)
    return(mod)
  }
    
  # this block does all of the modelling and summaries of the models.
  freq_nest &lt;- freq_to_use %&gt;%
                  dplyr::group_by(Speaker, Gram2) %&gt;%
                  tidyr::nest()%&gt;%
                  dplyr::mutate(mod = purrr::map(data, fit_one_freq_mod),
                                tidy = map(mod, broom::tidy),
                                n = purrr::map(data, nrow)%&gt;%simplify())

  # extrating the tidy summaries for plotting
  freq_coefs &lt;- freq_nest %&gt;%
                    tidyr::unnest(tidy) %&gt;%
                    dplyr::select(-(std.error:p.value)) %&gt;%
                    tidyr::spread(term, estimate)</code></pre>



<pre><code class="prettyprint ">  freq_coefs%&gt;%
      ggplot(aes(`(Intercept)`, zipf_center, color = Gram2))+
        geom_point(aes(size = n), alpha = 0.6)+
        coord_fixed()</code></pre>

![center]({{site.baseurl}}/figs/many_modelsplot_freq-1.svg)

Unlike the rate of speech, it looks like there is quite a bit of interspeaker variation in their sensitivity to word frequency, *and* it's related to their baseline rate of /t d/ retention. 
Speakers with a higher baseline deletion rate have a *weaker* frequency effect. 
You can kind of see this in the output of a standard mixed effects model, but it's rolled up in the random-effects report that we usually don't pay enough attention to.



<pre><code class="prettyprint ">  freq_data &lt;- freq_nest%&gt;%unnest(data)
  
  freq_mod &lt;- glmer(td ~ zipf_center*Gram2 + (zipf_center|Speaker) + (1|Word),
                    data = freq_data,
                    family = binomial)
  
  summary(freq_mod)</code></pre>



<pre><code>## Generalized linear mixed model fit by maximum likelihood (Laplace
##   Approximation) [glmerMod]
##  Family: binomial  ( logit )
## Formula: td ~ zipf_center * Gram2 + (zipf_center | Speaker) + (1 | Word)
##    Data: freq_data
## 
##      AIC      BIC   logLik deviance df.resid 
##  13746.6  13805.9  -6865.3  13730.6    12163 
## 
## Scaled residuals: 
##     Min      1Q  Median      3Q     Max 
## -5.1754 -0.6912  0.3073  0.6549  3.9010 
## 
## Random effects:
##  Groups  Name        Variance Std.Dev. Corr 
##  Word    (Intercept) 1.05171  1.0255        
##  Speaker (Intercept) 0.28874  0.5373        
##          zipf_center 0.07198  0.2683   -0.43
## Number of obs: 12171, groups:  Word, 1007; Speaker, 38
## 
## Fixed effects:
##                       Estimate Std. Error z value Pr(&gt;|z|)    
## (Intercept)            0.88120    0.12105   7.279 3.35e-13 ***
## zipf_center           -0.13821    0.09446  -1.463    0.143    
## Gram2past              0.65529    0.12451   5.263 1.42e-07 ***
## zipf_center:Gram2past -0.07027    0.13884  -0.506    0.613    
## ---
## Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
## 
## Correlation of Fixed Effects:
##             (Intr) zpf_cn Grm2ps
## zipf_center -0.480              
## Gram2past   -0.432  0.321       
## zpf_cntr:G2  0.218 -0.530 -0.328
</code></pre>

Up there in the random effects summary, you can see that the correlation between speaker-level intercepts and speaker-level frequency effects is -0.43, which means more or less the same thing as the figure above.

## Takeaway

I think there's a tendency when we have a nice big data set in hand to skip straight to fitting one big mixed-effects model to rule them all.
But in rushing headlong into the one big model and focusing on the p-values on the fixed effects, we might be missing some important and interesting patterns in our data.

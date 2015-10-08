---
layout: post
title: "The Average of Formant Dynamics Doesn't Have the Average Dynamic Properties"
comments: true
date: 2015-10-08 15:10:58
author: [{name: "Joe", url: "jofrhwld.github.io"}]
---

I've been playing around with an analsis method called "Functional Data Analysis", which has me looking at the kinds of analyses we do of formant measurements a bit differently. 
In sociolinguistics, we've inherited an intellectual and methodological tradition of characterizing vowels, including diphthongs, using single point measurements.
More historiography needs to be done on *why* this is, but I think it might be a long carry over from Daniel Jone's cardinal vowels theory, plus Trager & Bloch's theory characterizing English has having 6 phonemic vowels.
I've got a table here of Trager & Bloch's phonemic theory, cause it's kind of beautiful.

|phoneme| V     | /V/+j  | /V/+w  | /V/+h|
| ---- | ---- | ----- | ----- |
| /i/ | *pit* | *pea* | *dew* | *idea* |
| /e/ | *pet* | *pay* | -- | *yeah* |
| /a/ | *pat* | *buy* | *bough* | *pa* |
| /o/ | *pot* | *boy* | -- | *paw* | 
| /ə/ | *butt* | -- | *beau* | *huh* |
| /u/ | *put* | -- | *boo* | *Kahlua* | 


In any event, a common alternative to characterizing vowels in terms of point measurements of steady states is to take a fixed number of measurements along the full formant track, or to measure the formants at specific points proportional to the vowel's duration. This latter approach is supported by FAVE, which outputs F1 and F2 at 20%, 35%, 50%, 65% and 80% of the vowel's duration. My own take is that this approach is better for trying to understand formant dynamics, but has its own shortcomings that I'll discuss here. I'll also discuss a potential alternative using functional data analysis.






<pre><code class="prettyprint ">  # Setting up for this post.
  # NB: For some reason summarise() and mutate() from plyr
  # wind up getting loaded when I compile this post, so I 
  # have to use dplyr::mutate and dplyr::summarise throughout
  library(knitr)

  library(dplyr)
  library(tidyr)
  library(magrittr)
  library(fda)
  library(ggplot2)

  opts_chunk$set(cache = T, message=  F, fig.width = 8/1.5, 
                 fig.height = 5/1.5, dev = 'svg', message = F, autodep = T,
                 cache.path = &quot;rmd_drafts/prop_problems/&quot;)
  dep_auto()</code></pre>

To demonstrate for this post, I'll be using formant tracks from my own speech as an interviewer from 2006. 
Since FAVE v1.2, the option has existed to save the *full* formant tracks of each vowel analyzed with the `--tracks` flag.
I'll be focusing on pre-voiceless /ay/ since it's got nice and dynamic F1 to explore, and it's my favorite.
I've put the data online, so you can run all of this code at home.



<pre><code class="prettyprint ">  tracks &lt;- read.delim(&quot;http://jofrhwld.github.io/data/fruehwald.txt&quot;)
  ays &lt;- tracks %&gt;%
          filter(plt_vclass %in% c(&quot;ay0&quot;)) %&gt;%
          filter(!word == &quot;LIKE&quot;) %&gt;%
          group_by(id) %&gt;%
          dplyr::mutate(t_rel = t-min(t),
                        t_prop = t_rel/max(t_rel))</code></pre>


As a quick demonstration, here's a plot of 3 cherry picked F1 tracks, plotted across proportional time, with the 20%, 35%, 50%, 65% and 80% points marked.


<pre><code class="prettyprint ">  example_tracks &lt;- ays %&gt;% 
                      filter(id %in% c(756, 758, 1088))
  
  example_points &lt;- example_tracks %&gt;%
                      group_by(id) %&gt;%
                      slice(round(c(0.2, 0.35, 0.5, 0.65, 0.8) * n())) %&gt;%
                      mutate(prop = c(0.2, 0.35, 0.5, 0.65, 0.8))
  

  example_tracks %&gt;%
    ggplot(aes(t_prop, F1))+
      geom_line(aes(group = id))+
      geom_point(data = example_points, aes(color = factor(prop)), size = 3)</code></pre>

![center]({{site.baseurl}}/figs/problem_with_proportionsplot_sample_prop-1.svg) 

Looking at these formant tracks, it looks like an important feature is that F1 increases, reaches a maximum, then decreases.
But that landmark feature happens at different points in proportional time for each of these formant tracks.
for the lowest curve, the 20% time point seems closesest to the F1-maximum landmark, for the middle curve, the 35% point is closest, and for the highest curve it's actually the 50% point.
This poses a general problem for averaging across these proportional points in order to explore formant dynamics, since each token is at a different phase of its track at each point.
At 50% of the duration, for example, two of the tokens are well into the transition from the nucleus to the glide, while the third is just reaching its maxmimum.
By just averaging at the 50% point, you're averaging over values that aren't *dynamically equivalent*.

There is another approach that still allows for the analysis of formant trajectories, and tries to address the problem of dynamic equivalency.
It involves the following steps:

1. Convert the scalar representation of the formant data to a functional representation.
2. Identify key landmarks in each function.
3. Carry out landmark registration.
4. Calculate averages.

The first step needs some explaining. In the dataframe `example_tracks`, the data is represented as being just a collection of times and F1s.
For each row \\(i\\), you have a pair of observations, \\(\langle x_i, y_i \rangle\\), specifically \\(\langle \text{time}_i, \text{F1}_i \rangle\\). 
But really, we want to think about F1 as a function of time, or \\(y=f(x)\\), or \\(\text{F1}=f(\text{time})\\).

I'll be making this conversion from the \\(\langle x_i, y_i \rangle\\) to the \\(y=f(x)\\) representation for each formant track.
There are a few ways to go about this using the `fda` package, and a few different parameters under my control that will affect the resulting functional representation for each formant track, all of which takes a while to explain.
For now, I'll describe without explaining too much.
First, I'll be using a relatively large b-spline basis, and penalize the roughness of the acceleration of the function (a.k.a. its second derivative).


<pre><code class="prettyprint ">  # I'm leveraging dplyr's ability to store lists in columns.
  example_tracks %&gt;%
    group_by(id) %&gt;%
    dplyr::mutate(t_rel = t-min(t),
                  t_prop = t_rel/max(t_rel),
                  duration = max(t_rel)) %&gt;% 
    group_by(word, fol_seg, id, plt_vclass, duration, context) %&gt;%
    do(f1 = c(.$F1),
       f2 = c(.$F2),
       t_prop = c(.$t_prop))-&gt;examples_vector</code></pre>


<pre><code class="prettyprint ">  # Defining the b-spline basis.
  # This one has a pretty large number of knots given the 
  # amount of wiggliness we're looking for.
  
  basic_basis &lt;- create.bspline.basis(rangeval = c(0, 1), 
                                      nbasis = (30 + 5)-2, 
                                      norder = 5)</code></pre>

Here's a demonstration of how the FDA works for one of the formant tracks.
The figure plots the original F1 formant track measurements with the open circles, and the bold red line is the new functional representation.


<pre><code class="prettyprint ">  sample_time &lt;- examples_vector$t_prop[[2]]
  sample_f1 &lt;- examples_vector$f1[[2]]
  
  # Maximum Likelihood fit.
  # With the size of the basis, this is almost completely perfect fit.
  # RMSE = 0.1972364, certainly overfit.
  sample_fit &lt;- smooth.basis(sample_time, sample_f1, basic_basis)
  
  # Smooth with a roughness penalty on the acceleration
  # Lfdobj = the derivative number
  # 0 = original F1, 1 = velocity, 2 = acceleration
  sample_smooth &lt;- smooth.fdPar(sample_fit$fd, Lfdobj = 2, lambda = 1e-5)
  
  plot(sample_time, sample_f1, cex = 0.5)
  x &lt;- plot(sample_smooth, add = T, col = 'red', lwd = 3)</code></pre>

![center]({{site.baseurl}}/figs/problem_with_proportionssample-1.svg) 

One of the great benefits of converting the scalar representation to the functional representation is that we can also calculate the first and second derivatives of the function, to give us the rate of change in F1, and the rate of acceleration in F1.


<pre><code class="prettyprint ">  # the assignment here is just to capture an annoying
  # &quot;done&quot; value plot.fd produces
  par(mfrow = c(1,3))
  x &lt;- plot(sample_smooth, Lfdobj = 0)
  title(&quot;F1&quot;)
  
  x &lt;- plot(sample_smooth, Lfdobj = 1)
  title(&quot;F1 velocity&quot;)

  x &lt;- plot(sample_smooth, Lfdobj = 2)
  title(&quot;F1 acceleration&quot;)  </code></pre>

![center]({{site.baseurl}}/figs/problem_with_proportionsplot_derivs-1.svg) 

If it's not clear from eyeballing this figure, where the velocity of F1 crosses zero with a negative slope is where F1 reaches its maximum.
I've written a little function that will return zero-crossing locations if you give it a functional data object.
You can look at it [here](https://gist.github.com/JoFrhwld/f75528f7b358148ed9fb).




<pre><code class="prettyprint ">  library(devtools)
  source_gist(&quot;https://gist.github.com/JoFrhwld/f75528f7b358148ed9fb&quot;, 
              quiet = T)</code></pre>


<pre><code class="prettyprint ">  sample_zero_cross &lt;- zero_crossings(sample_smooth, Lfdobj = 1, slope = -1)
  
  x &lt;- plot(sample_smooth)
  abline(v = sample_zero_cross, lty = 2)</code></pre>

![center]({{site.baseurl}}/figs/problem_with_proportionsunnamed-chunk-2-1.svg) 

So our next steps will be to smooth all three of these formant tracks in the same way, and identify the same landmark in all of them.
Here's the `dplyr` code I've used to fit a b-spline curve to each formant track, and smooth it with a roughness penalty on the acceleration.



<pre><code class="prettyprint ">  example_smoothed &lt;- examples_vector %&gt;%
                        rowwise()%&gt;%
                        do(fdobj = smooth.basis(.$t_prop, 
                                                .$f1, 
                                                basic_basis)$fd %&gt;%
                                    smooth.fdPar(., Lfdobj = 2, lambda = 1e-5)) 
  
  # a list2fd function
  source_gist(&quot;https://gist.github.com/JoFrhwld/0b0f69ca1a341f38f275&quot;,
         quiet = T)
  
  example_fd &lt;- list2fd(example_smoothed$fdobj, basic_basis)
  par(mfrow = c(1,3))
  x &lt;- plot(example_fd, lty = 1)
  title(&quot;F1&quot;)
  
  x &lt;- plot(example_fd, Lfdobj = 1, lty = 1)
  title(&quot;F1 velocity&quot;)
  
  x &lt;- plot(example_fd, Lfdobj = 2, lty = 1)
  title(&quot;F1 acceleration&quot;)  </code></pre>

![center]({{site.baseurl}}/figs/problem_with_proportionsunnamed-chunk-3-1.svg) 

Just like it was in the original plot of the raw formant tracks, these functions reach their F1 maximum at different points in proportional time, which is really clear to see if you look at where the velocity crosses zero for each.
This next figure plots the F1 function with a vertical line indicating the position of the zero crossing.


<pre><code class="prettyprint ">  example_zero_cross &lt;- zero_crossings(example_fd, Lfdobj = 1, slope = -1)
  
  x &lt;- plot(example_fd, lty = 1)
  abline(v = example_zero_cross, col = 1:3, lty = 2)</code></pre>

![center]({{site.baseurl}}/figs/problem_with_proportionsunnamed-chunk-4-1.svg) 


The next step in the functional data analysis is to *register* these functions with regards to their landmarks. 
I have to admit that I don't fully understand how this works, but it involves warping the time domain.
The warping can be non-linear, so we'll be defining a basis function similar to the original basis we used for smoothing the formant tracks.
One thing to note is that we'll be warping the time domain for these functions according to just one landmark, but it is possible to define multiple landmarks for each function.


<pre><code class="prettyprint ">  wbasis &lt;- create.bspline.basis(rangeval=c(0,1),
                                 norder=4, 
                                 breaks=seq(0, 1, len=10))
  Wfd0   &lt;- fd(matrix(0, wbasis$nbasis, 1), wbasis)
  WfdPar &lt;- fdPar(Wfd0, 1, 1e-4)
  
  example_regfd &lt;- landmarkreg(example_fd, 
                               ximarks = example_zero_cross, 
                               WfdPar = WfdPar)</code></pre>



<pre><code>## Progress:  Each dot is a curve
## ...
</code></pre>



<pre><code class="prettyprint ">  # Plotting a comparison between the original and registered curves
  par(mfrow = c(1,2))
  x &lt;- plot(example_fd, lty = 1)
  abline(v = example_zero_cross, col = 1:3, lty = 2)
  title(&quot;original&quot;)
  
  x &lt;- plot(example_regfd$regfd, lty = 1)
  abline(v = mean(example_zero_cross), lty = 2)
  title(&quot;registered&quot;)</code></pre>

![center]({{site.baseurl}}/figs/problem_with_proportionsunnamed-chunk-5-1.svg) 

Each curve has been warped so that their F1 maximum ocurrs at the same time.
This is going to have the biggest effect on the mean value of each set of curves.
By the way, b-splines have some really pleasing properties when it comes to estimating means, and broader analyses.
You just take the mean across each b-spline coefficient.




<pre><code class="prettyprint ">  # getting the mean function for the original
  # and registered functions
  mean_fd &lt;- mean(example_fd)
  mean_regfd &lt;- mean(example_regfd$regfd)
  
  # Prediction and plotting
  data_frame(time = seq(0, 1, length = 100),
             original = predict(mean_fd, newdata = time)[,1],
             registered = predict(mean_regfd, newdata = time)[,1])%&gt;%
    gather(type, F1, original:registered) %&gt;%
    ggplot(aes(time, F1, color = type))+
      geom_line()+
      scale_color_brewer(palette = &quot;Dark2&quot;)+
      theme_bw()</code></pre>

![center]({{site.baseurl}}/figs/problem_with_proportionsmean_vs_reg-1.svg) 


The mean of the registered functions is different from the mean of the original functions in two ways: the location of the F1 maximum is different, and the magnitude of the F1 maximum is different.
I would argue that the mean of the registered function is different in a good direction.


<pre><code class="prettyprint ">  locations = c(original = zero_crossings(mean_fd, Lfdobj = 1, slope = -1),
                registered = zero_crossings(mean_regfd, Lfdobj = 1, slope = -1))
  
  magnitudes = c(original = eval.fd(locations[1], mean_fd),
                 registered = eval.fd(locations[2], mean_regfd))
  
  rbind(locations, magnitudes)  </code></pre>



<pre><code>##            original registered
## locations    0.3080     0.3320
## magnitudes 777.6665   781.8978
</code></pre>

The peak F1 occurs later in the mean for the registered function than the original functions. 
We previously estimated the peak F1 time for each of the original functions, and if we take the average of those, it's the same as the peak F1 time for the mean of the registered functions.


<pre><code class="prettyprint ">  example_zero_cross</code></pre>



<pre><code>## [1] 0.193 0.305 0.499
</code></pre>



<pre><code class="prettyprint ">  mean(example_zero_cross)  </code></pre>



<pre><code>## [1] 0.3323333
</code></pre>

Similarly, the mean F1 maximum of the registered functions is higher than for the original functions.
Again, the mean of the registered functions is closer to the mean of each of the original functions F1 maximum.


<pre><code class="prettyprint ">  # getting f1 maximum from each original function
  f1_maxes &lt;- eval.fd(example_zero_cross, example_fd) %&gt;% diag
  f1_maxes</code></pre>



<pre><code>## [1] 735.2563 791.2658 819.1636
</code></pre>



<pre><code class="prettyprint ">  mean(f1_maxes)</code></pre>



<pre><code>## [1] 781.8952
</code></pre>

The lesson here is that the simple average of formant dynamics will not have the average dynamic properties of the input.

<hr class = "style-two">

There are pros and cons to doing landmark registration like this.
For example, it seems pretty clear that the duration of the vowel is going to be a predictor of where the F1 maximum occurs in proportional time. 
If you wanted to explore those properties, you wouldn't want to do that analysis on registered functions.

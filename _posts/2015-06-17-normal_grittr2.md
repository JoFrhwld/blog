---
layout: post
title: "Tidy Data, Split-Apply-Combine, and Vowel Data: Part 2"
comments: true
date: 2015-06-17 15:26:19
author: [{name: "Joe", url: "jofrhwld.github.io"}]
---

This is part two of my blog post on how vowel formant data ought to be thought about in terms of [Tidy Data](http://www.jstatsoft.org/v59/i10/paper), and Vowel Normalization can be thought about in terms of [Split-Apply-Combine](http://www.jstatsoft.org/v40/i01/paper) procedures.
Let's start out by getting our data in order.


<pre><code class="prettyprint ">library(downloader)
library(magrittr)
library(dplyr)
library(tidyr)
library(ggplot2)</code></pre>


<pre><code class="prettyprint ">  ## temp file for downloading
  tmp &lt;- tempfile()
  pb_tar &lt;- download(&quot;https://www.cs.cmu.edu/Groups/AI/areas/speech/database/pb/pb.tgz&quot;, 
                     tmp, quiet = T)
  
  ## decompress the data
  untar(tmp, &quot;PetersonBarney/verified_pb.data&quot;)
  
  ## read the data
  pb_data &lt;- read.delim(&quot;PetersonBarney/verified_pb.data&quot;, header = F)
  
  ## cleanup
  unlink(tmp)
  success &lt;- file.remove(&quot;PetersonBarney/verified_pb.data&quot;)
  success &lt;- file.remove(&quot;PetersonBarney&quot;)

  pb_data %&gt;%
    set_colnames(c(&quot;sex&quot;, &quot;speaker&quot;, &quot;phonN&quot;, &quot;phon&quot;, 
                   &quot;F0&quot;, &quot;F1&quot;, &quot;F2&quot;, &quot;F3&quot;)) %&gt;%
    mutate(sex = factor(sex, labels = c(&quot;C&quot;,&quot;F&quot;,&quot;M&quot;),levels = 3:1),
           phon = gsub(&quot;\\*&quot;, &quot;&quot;, phon)) %&gt;%
    select(sex, speaker, phon, F0, F1, F2, F3) %&gt;%
    mutate(id = 1:n())%&gt;%
    gather(formant, hz, F0:F3)%&gt;%
    tbl_df()-&gt; pb_long</code></pre>

We're going to be treating vowel formant data as having the following variables:

- The speaker whose vowel was measured
- The id of the vowel that was measured.
- The phonemic identity of the vowel that was measured.
- The formant that was measured.
- The the value of the measurement in Hz.

This means that each individual vowel token will have 4 rows in the `pb_long` data frame, one for each formant.

<pre><code class="prettyprint ">  pb_long %&gt;%
    filter(id == 1)%&gt;%
    kable()</code></pre>



|sex | speaker|phon | id|formant |   hz|
|:---|-------:|:----|--:|:-------|----:|
|M   |       1|IY   |  1|F0      |  160|
|M   |       1|IY   |  1|F1      |  240|
|M   |       1|IY   |  1|F2      | 2280|
|M   |       1|IY   |  1|F3      | 2850|

# Normalization

The need for vowel formant normalization can be neatly summarized in the following plot, which has a boxplot for each "sex" (in Peterson & Barney, that's C: Child, F: Female, M: Male) for each formant.
You can see how:

- For each formant the overall distribution of values goes C > F > M,
- The difference between each group appears to get more extreme the higher the formant.


<pre><code class="prettyprint ">  pb_long %&gt;%
    ggplot(aes(formant, hz, fill = sex))+
      geom_boxplot()</code></pre>

![center]({{site.baseurl}}/figs/normal_grittr2unnorm_box-1.svg) 

One thing that's not immediately evident from the figure above is that the variance of formant values also differs between each sex, also following the pattern C > F > M



<pre><code class="prettyprint ">  pb_long %&gt;%
    group_by(speaker, sex, formant) %&gt;%
    summarise(hz_sd = sd(hz))%&gt;%
    ggplot(aes(formant, hz_sd, fill = sex))+
      geom_boxplot()</code></pre>

![center]({{site.baseurl}}/figs/normal_grittr2unnorm_sd-1.svg) 

The usual way of representing these sex effects emphasizes the effect it has on the vowel triangle, which is especially evident in the high front region.


<pre><code class="prettyprint ">  pb_long %&gt;%
    spread(formant, hz) %&gt;%
    ggplot(aes(F2, F1, color = sex))+
      geom_point()+
      scale_x_reverse()+
      scale_y_reverse()+
      coord_fixed()</code></pre>

![center]({{site.baseurl}}/figs/normal_grittr2unnorm_triangle-1.svg) 

The fact there are these differences in vowel spectra and the reasons for it are interesting, but when you're doing research like this, not all interesting phenomena are the object of study.
Usually, sociolinguists want to factor out gross sex differences involving the *location* and *scale* of the formant values.
This usually involves transforming formant values by subtraction and division with reference to some other set of values.
How you characterize that process is the point of this post.


A literature developing a typology for normalization in sociolinguistics has sprung up, beginning with Adank (2003).
Procedures are usually characterized by what subsets of the data are used to estimate normalization parameters. 
For example:


#### Speaker
- *Speaker Intrinsic* Parameters estimated within each individual speaker's data.
- *Speaker Extrinsic* Parameters estimated across multiple speakers' data.

#### Formant:
- *Formant Intrinsic* Each formant is separately normalized.
- *Speaker Extrinsic* Multiple formants are normalized simultaneously.

#### Vowel (token)
- *Vowel Intrinsic* Each vowel token is normalized individually.
- *Vowel Extrinsic* Multiple vowels are normalized simultaneously.

I'll be looking at 6 normalization procedures in this post, and they break down like so (speaker extrinsic in bold).

|       | Vowel Token Intrinsic | Vowel Token Extrinsic |
| :---- | :------------ | :----------- |
| Formant Intrinsic |         |   Z-score, Neary1, Watt & Fabricius           |
| Formant Extrinsic |  Bark Difference    |    Neary2, **ANAE**      |

To a large degree, this "intrinsic" vs "extrinsic" distinction can be captured by which variables are included in a ``dplyr::group_by()`` operation.
I'll try to be pedantic about that fact in the R code below, even if the particular grouping is going to be vacuous with respect to R's vectorized arithmetic.

Another thing you might notice looking at the code is that these normalization procedures can be characterized by a few other data base operations. 
For example some require `tidr::spread()` while others don't, meaning they have different models of [what constitutes an observation](https://jofrhwld.github.io/blog/2015/06/13/normal_grittr.html#tidy-data).
Some also require what I'll call a resetting of the "scope" of analysis.
That is, they take the raw data, run through a chain of operations, then need to return back to the raw data, merging back in the results of the first chain of operations.

The point of this post isn't really to compare the effectiveness of these procedures relative to what kinds of grouping and data base operations they require, or their model of a observation.
Comparisons of normalization procedures <s>have been done to death</s> are well understood.
This is more about exploring the structure of data and database operations in a comfortable domain for sociolinguists.


## Bark Difference Metric

First off is the Bark Difference Metric, which is the only *vowel intrinsic* method I'll be looking at.
It tries to normalize F1 and F2 with respect to either F0 or F3. It also converts the Hz to [Bark](https://en.wikipedia.org/wiki/Bark_scale) first, which tamps down on the broader spread of the higher formants a bit.
±1 on the Bark scale is also supposed to be psychoacoustically meaningful.

First, I'll define a function that takes Hz values and converts them to bark.

<pre><code class="prettyprint ">  bark &lt;- function(hz){
    (26.81/(1+(1960/hz)))-0.53
  }</code></pre>

Here's the chain of operations that does the Bark difference normalization.

- Convert `hz` to `bark`
- drop the `hz` column
- create columns for each formant, filled with their value in `bark`
- `group_by()` vowel token id (vacuous)
- normalize backness by F3-F2
- normalize height by F1-F0


<pre><code class="prettyprint ">  pb_long %&gt;%
    mutate(bark = bark(hz))%&gt;%
    select(-hz)%&gt;%
    spread(formant, bark)%&gt;%
    group_by(id)%&gt;%
    mutate(backness = F3-F2,
           height = F1-F0)-&gt;pb_bark</code></pre>

Here's how that looks.


<pre><code class="prettyprint ">  pb_bark %&gt;%
    ggplot(aes(backness, height, color = sex))+
      geom_point(alpha = 0.75)+
      scale_y_reverse()+
      coord_fixed()</code></pre>

![center]({{site.baseurl}}/figs/normal_grittr2bark1_fig-1.svg) 

Some things to notice about the resulting normalized space:

- As the backness dimension increases, so does backness. As the height dimension increases, so does lowness (hence the reversed y-axis).
- The relative relationship between F1 and F2 has been eliminated. They both run on scales from about 0 to about 9.
- The larger variance in backness relative to height is preserved, but is mitigated relative to the raw Hz.

### Bark Difference Summary

#### Model of an observation
- F0, F1, F2, and F3 for each vowel token for each speaker.

#### Scope resets

- None.



## ANAE

The Atlas of North American English is a formant extrinsic, speaker extrinsic normalization technique.
It involves calculating the grand average log(hz) for all speakers for F1 and F2 combined.
Here's a function to do the actual normalization calculation.


<pre><code class="prettyprint ">  anae_fun &lt;- function(hz, grand_mean){
    hz * (exp(grand_mean - mean(log(hz))))
  }</code></pre>

While `pb_long` already has the data in the correct format to do this easilly, the original ANAE approach only looked at F1 and F2, so we need to filter the data to only have those rows corresponding to F1 and F2 estimates.

This `dplyr` chain does that filtering, groups the data by speaker, estimates the mean log(hz) for each speaker, then the grand mean across all speakers.


<pre><code class="prettyprint ">  pb_long %&gt;%
    filter(formant %in% c(&quot;F1&quot;,&quot;F2&quot;))%&gt;%
    group_by(speaker)%&gt;%
    summarise(log_mean = mean(log(hz)))%&gt;%
    summarise(log_mean = mean(log_mean))%&gt;%
    use_series(&quot;log_mean&quot;)-&gt; grand_mean</code></pre>

We now need to return to the whole data set, and use this grand mean to normalize the data within each speaker.
We need to group by the speaker, so that we can estimate individual speakers' mean log(hz).


<pre><code class="prettyprint ">  pb_long %&gt;%
    filter(formant %in% c(&quot;F1&quot;,&quot;F2&quot;))%&gt;%    
    group_by(speaker)%&gt;%
    mutate(norm_hz = anae_fun(hz, grand_mean))-&gt;pb_anae_long</code></pre>

This method preserves both the relative ordering of F1 and F2, as well as the greater spread in F2 relative to F1.


<pre><code class="prettyprint ">  pb_anae_long %&gt;%
    ggplot(aes(formant, norm_hz, fill = sex))+
      geom_boxplot()</code></pre>

![center]({{site.baseurl}}/figs/normal_grittr2anae_box-1.svg) 

Here's how it looks in the vowel triangle.

<pre><code class="prettyprint ">  pb_anae_long %&gt;%
    select(-hz)%&gt;%
    spread(formant, norm_hz)%&gt;%
    ggplot(aes(F2, F1, color = sex))+
      geom_point(alpha = 0.75)+
      scale_x_reverse()+
      scale_y_reverse()+
      coord_fixed()</code></pre>

![center]({{site.baseurl}}/figs/normal_grittr2anae_fig-1.svg) 

### ANAE Summary

#### Model of an observation
- Hz for each formant for each vowel token for each speaker

#### Scope resets

- One.

## Neary

Neary normalization is essentially identitcal to the ANAE normalization, except it's speaker intrinsic. 
That's not always clear given the way the ANAE and Neary formulas are usually given, so I've defined the Neary formula below in a way to emphasize this fact.
`neary_fun()` is identical to `anae_fun()` except it takes a single argument, and `grand_mean` is replaced by 0.


<pre><code class="prettyprint ">  neary_fun &lt;- function(hz){
    hz * (exp(0 - mean(log(hz))))
  }</code></pre>

There are two instantiations of Neary. Neary1 is formant intrinsic, and Neary2 is formant extrinsic.


Neary is easy peasy. 

- group data, appropriately
- apply the normalization function


<pre><code class="prettyprint ">  pb_long %&gt;%
    group_by(speaker, formant)%&gt;%
    mutate(neary = neary_fun(hz)) -&gt; pb_neary1_long
  
  pb_long %&gt;%
    filter(formant %in% c(&quot;F1&quot;,&quot;F2&quot;))%&gt;%
    group_by(speaker)%&gt;%
    mutate(neary = neary_fun(hz)) -&gt; pb_neary2_long  </code></pre>

The formant intrinsic approach eliminates the relative ordering of each formant, and mitigates the difference in variance, at least between F1 and F2.
The formant extrinsic approach looks roughly similar to the ANAE plot


<pre><code class="prettyprint ">  pb_neary1_long %&gt;%
    ggplot(aes(formant, neary, fill = sex)) + 
      geom_boxplot()+
      ggtitle(&quot;Neary1: Formant intrinsic&quot;)</code></pre>

![center]({{site.baseurl}}/figs/normal_grittr2neary_box-1.svg) 



<pre><code class="prettyprint ">  pb_neary2_long %&gt;%
    ggplot(aes(formant, neary, fill = sex)) + 
      geom_boxplot()+
      ggtitle(&quot;Neary2: Formant extrinsic&quot;)</code></pre>

![center]({{site.baseurl}}/figs/normal_grittr2neary2_box-1.svg) 

Here's how it looks in the vowel space.
For Neary1, I've included horizontal and vertical lines at 1, since these represent the "center" of the vowel space as far as the normalization is concerned.


<pre><code class="prettyprint ">  pb_neary1_long %&gt;%
    select(-hz)%&gt;%
    spread(formant, neary)%&gt;%
    ggplot(aes(F2, F1, color = sex))+
      geom_hline(y = 1)+
      geom_vline(x = 1)+
      geom_point(alpha = 0.75)+
      scale_y_reverse()+
      scale_x_reverse()+
      coord_fixed()+
      ggtitle(&quot;Neary1: Formant intrinsic&quot;)</code></pre>

![center]({{site.baseurl}}/figs/normal_grittr2neary1_fig-1.svg) 


<pre><code class="prettyprint ">  pb_neary2_long %&gt;%
    select(-hz)%&gt;%
    spread(formant, neary)%&gt;%
    ggplot(aes(F2, F1, color = sex))+
      geom_point(alpha = 0.75)+
      scale_y_reverse()+
      scale_x_reverse()+
      coord_fixed()+
      ggtitle(&quot;Neary2: Formant extrinsic&quot;)</code></pre>

![center]({{site.baseurl}}/figs/normal_grittr2neary2_fig-1.svg) 

### Neary Summary

#### Model of an observation

- Hz for each formant for each vowel token for each speaker

#### Scope resets

- None

## Z-Score (a.k.a. Lobanov)

Z-scores are one of the most wide spread forms of normalization across any area of research. 
For example, [Gelman, Jakulin, Pittau & Su](http://www.stat.columbia.edu/~gelman/research/published/priors11.pdf)
recommend that for logistic regressions, all continuous variables be converted to a modified z-score: \\(\frac{x-mean(x)}{2sd(x)}\\).
The ubiquity of the z-score across all domains of research, and the relative obscurity of what the "Lobanov" normalization is, is why I'll always describe this procedure as "z-score normalization (also known as Lobanov normalization)".

The z-score function itself is straight forward. R actually has a native z-scoring function `scale()`, but I'll write out a fuction called `zscore()` just for explicitness.


<pre><code class="prettyprint ">  zscore &lt;- function(hz){
    (hz-mean(hz))/sd(hz)
  }</code></pre>

To apply it to the data, it requires just one grouped application.


<pre><code class="prettyprint ">  pb_long %&gt;%
    group_by(speaker, formant) %&gt;%
    mutate(zscore = zscore(hz)) -&gt;  pb_z_long</code></pre>

Z-scores eliminate the relative ordering of the formants, and mitigate the different variances between them.


<pre><code class="prettyprint ">  pb_z_long %&gt;%
    ggplot(aes(formant, zscore, fill = sex))+
      geom_boxplot()</code></pre>

![center]({{site.baseurl}}/figs/normal_grittr2unnamed-chunk-13-1.svg) 


Maybe I'm just biased because z-scores are what I always use, but this to me looks like what a vowel space should.

<pre><code class="prettyprint ">  pb_z_long %&gt;%
    select(-hz)%&gt;%
    spread(formant, zscore)%&gt;%
    ggplot(aes(F2, F1, color= sex))+
      geom_hline(y = 0)+
      geom_vline(x = 0)+
      geom_point(alpha = 0.75)+
      scale_y_reverse()+
      scale_x_reverse()+
      coord_fixed()</code></pre>

![center]({{site.baseurl}}/figs/normal_grittr2z_fig-1.svg) 


## Watt & Fabricius

The Watt & Fabricius method (and ensuing modifications) focuses on normalizing vowels in terms of aligning vowel triangles in F1xF2 space.
As such, it's model of an observation is implicitly F1 and F2 for each vowel token.

The basic Watt & Fabricius function involves dividing each speaker's F1 and F2 by  "centroid" values, corresponding to the center of the vowel triangle.


<pre><code class="prettyprint ">  wf_fun &lt;- function(hz, centroid){
    hz/centroid
  }</code></pre>

The method involves two steps. 
First, estimating the centroid values for F1 and F2 for each speaker.
Second, after merging these centroid values back onto the original data, dividing F1 and F2 by them.


<pre><code class="prettyprint "># Part 1: Centriod Estimation
  pb_long %&gt;%
    filter(formant %in% c(&quot;F1&quot;,&quot;F2&quot;))%&gt;%
    group_by(speaker, formant, phon)%&gt;%
    summarise(hz = mean(hz))%&gt;%
    spread(formant, hz)%&gt;%
    group_by(speaker)%&gt;%
    summarise(beet1 = F1[phon==&quot;IY&quot;],
              beet2 = F2[phon==&quot;IY&quot;],
              school1 = beet1,
              school2 = beet1,
              bot1 = F1[phon==&quot;AA&quot;],
              bot2 = ((beet2 + school2)/2) + school2) %&gt;%
    mutate(S1 = (beet1 + bot1 + school1)/3,
           S2 = (beet2 + bot2 + school2)/3)%&gt;%
    select(speaker, S1, S2)-&gt;speaker_s
  
# Step 2: Merging on centroids and normalizing
  pb_long %&gt;%
    spread(formant, hz)%&gt;%
    left_join(speaker_s)%&gt;%
    group_by(speaker)%&gt;%
    mutate(F1_norm = wf_fun(F1, S1),
           F2_norm = wf_fun(F2, S2)) -&gt; pb_wf</code></pre>



<pre><code>## Joining by: &quot;speaker&quot;
</code></pre>

Here's the resulting vowel space. I'll say it does a helluva job normalizing /iy/.

<pre><code class="prettyprint ">  pb_wf %&gt;%
    ggplot(aes(F2_norm, F1_norm, color = sex))+
      geom_hline(y = 1)+
      geom_vline(x = 1)+
      geom_point(alpha = 0.75)+
      scale_y_reverse()+
      scale_x_reverse()+
      coord_fixed()</code></pre>

![center]({{site.baseurl}}/figs/normal_grittr2wf_fig1-1.svg) 

### Watt & Fabricius Summary

#### Observation Model

- F1 and F2 for each vowel token for each speaker

#### Scope Resets

- One


# Summary

So, here's a summary of these methods, classified by their observation models, number of scope resets, and their various trinsicities.

|      | Observation Model | Scope Resets | Speaker | Formant | Vowel |
| ---- | -------------   | ----------- | ------- | -------- | ------ |
| Bark Difference | F0, F1, F2, F3 for each vowel | 0 | intrinsic | extrinsic | instrinsic |
| ANAE | Hz for each formant |  1 | ex | ex | ex |
| Neary1 | Hz for each formant | 0 | in | in | ex |
| Neary2 | Hz for each formant | 0 | in| ex| ex |
| Z-score | Hz for each formant | 0 | in | in | ex  |
| Watt & Fabricius | F1, F2 for each vowel | 1 | in | in | ex |

It's kind of interesting how relatively orthogonal the observation model, the scope resetting and the trinsicities are.
Only two of the procedures I looked at involved scope resetting (ANAE, and Watt & Fabricius).
I believe scope resets are going to always be a feature of speaker-extrinsic models, since you'll need to estimate some kind of over-arching parameter for all speakers, then go back over each individual speaker's data.
But the fact Watt & Fabricius also involved a scope reset goes to show that they're not a property exclusive to speaker extrinsic normalization.
It's also probably the case that any given vowel intrinsic method will have an observation model similar to the Bark Difference metric, but again, Watt & Fabricius, an vowel extrinsic method, has a very similar model.


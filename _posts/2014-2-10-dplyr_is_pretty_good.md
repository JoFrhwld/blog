---
layout: post
title: dplyr is pretty good.
comments: true
date: 2014-2-11 15:20:00 
author: [{name: "Joe", url: "jofrhwld.github.io"}]
---

R man-god Hadley Wickham is at it again, releasing the ```dplyr``` package.
It's similar to his previous ```plyr``` package, but designed specifically for working with data frames, and highly optimized.
Just to show off a nice feature of its functionality, here's how we'd do the calcuation of TD-Deletion rates as I orignally described [here](http://val-systems.blogspot.co.uk/2012/05/on-calculating-exponents.html).

First, let's load the data.


<pre><code class="prettyprint ">library(plyr)
library(RCurl)
b &lt;- read.delim(textConnection(getURL(&quot;https://raw.github.com/JoFrhwld/TD-Classifier/master/Data/new_buckeye.txt&quot;)))
eval(parse(text = getURL(&quot;https://raw.github.com/JoFrhwld/TD-Classifier/master/R/buckCoder.R&quot;)))

b &lt;- subset(b, !(FolSeg %in% c(&quot;apical&quot;)) &amp; PreSeg != &quot;/r/&quot;)

psm &lt;- subset(b, Gram2 %in% c(&quot;past&quot;, &quot;semiweak&quot;, &quot;mono&quot;))

psm$Word &lt;- as.character(psm$Word)

psm$Gram2 &lt;- as.factor(psm$Gram2)
psm$Gram2 &lt;- relevel(psm$Gram2, &quot;past&quot;)</code></pre>



The first key ```dplyr``` function is ```group_by()```, which creates a grouped data frame (it also worth a bunch of other data table types, including ```data.table```, see ```?group_by()```).

<pre><code class="prettyprint ">library(dplyr)
psm_gr &lt;- group_by(psm, Gram2, Speaker, Word)
psm_gr</code></pre>



<pre><code>## Source: local data frame [8,962 x 26]
## Groups: Gram2, Speaker, Word
## 
##    Speaker Recording      Word WordBegin WordEnd POS seg SegTrans
## 1      s01    s0101a     lived     47.53   47.66 VBN   d        d
## 3      s01    s0101a    raised     51.17   51.24 VBN   d        d
## 4      s01    s0101a      west     51.50   51.69  JJ   t        s
## 5      s01    s0101a      kind     60.12   60.21  NN   d       nx
## 6      s01    s0101a  received     67.05   67.41 VBD   d        d
## 11     s01    s0101a different     92.08   92.24  JJ   t        t
## 12     s01    s0101a different     94.10   94.81  JJ   t        t
## 17     s01    s0101a      kind    124.20  124.24  NN   d       nx
## 19     s01    s0101a      kind    126.27  126.36  NN   d       nx
## 21     s01    s0101a   suggest    162.60  163.41  VB   t        t
## ..     ...       ...       ...       ...     ... ... ...      ...
## Variables not shown: PreSegTrans (fctr), FolSegTrans (fctr), DictNSyl
##   (int), NSyl (int), PreWindow (int), PostWindow (int), WindowBegin (dbl),
##   WindowEnd (dbl), DictRate (dbl), Rate (dbl), FolWord (fctr), Context
##   (fctr), Gram (chr), Gram2 (fctr), PreSeg (fctr), FolSeg (chr), DepVar
##   (chr), td (dbl)
</code></pre>


Now, first things first, there are ``8962`` rows to this data, and I made the previously stupid move of just printing it all, but the ```grouped_df``` class is a bit smarter in the way it prints, just showing the first few rows and columns. That's pretty nice.
I'll also call your attention to the second line of the printed output, where it says ```Groups: Gram2, Speaker, Word```.

Next, we can ```summarise``` the data.


<pre><code class="prettyprint ">summarise(psm_gr, td = mean(td))</code></pre>



<pre><code>## Source: local data frame [3,299 x 4]
## Groups: Gram2, Speaker
## 
##       Gram2 Speaker      Word     td
## 1      past     s40    caused 0.5000
## 2      mono     s40    racist 0.5000
## 3      mono     s40     adopt 1.0000
## 4      past     s40    teased 1.0000
## 5      mono     s40    effect 1.0000
## 6      mono     s40      fact 1.0000
## 7  semiweak     s40      felt 1.0000
## 8      mono     s40   against 1.0000
## 9      past     s40 legalized 1.0000
## 10     past     s40      used 0.3333
## ..      ...     ...       ...    ...
</code></pre>


Here we see the mean rate of TD retention per grammatical class, per speaker, per word. 
But look at the second line of the output.
It started out with ```Groups: Gram2, Speaker, Word```, but now it's ```Groups: Gram2, Speaker```.
Apparently, ever time you ```summarise``` a grouped data frame, the outermost layer of grouping is stripped away.
This is really useful for the kind of nested calculation of proportions that I argued is necessary for descriptive statistics in that Val Systems post.
And it's easy to do with ```dplyr``` which uses a custom operator, ```%.%```, which allows you to chain up these data manipulation operations.
Here's how you'd do the calculation of the rate of TD retention.



<pre><code class="prettyprint ">td_gram &lt;- psm %.% 
            group_by(Gram2, Speaker, Word) %.% 
            summarise(td = mean(td)) %.% # over word
            summarise(td = mean(td)) %.% # over speaker
            summarise(td = mean(td))     # over grammatical class
td_gram</code></pre>



<pre><code>## Source: local data frame [3 x 2]
## 
##      Gram2     td
## 1     past 0.7779
## 2     mono 0.5981
## 3 semiweak 0.7150
</code></pre>


I've been doing something similar for calculating mean F1 and F2 for vowels, which would look like this.


<pre><code class="prettyprint ">vowel_means &lt;- vowels  %.%
                group_by(Speaker, Age, Sex, DOB, VowelClass, Word) %.%
                summarise(F1.n = mean(F1.n), F2.n = mean(F2.n)) %.%  
                summarise(F1.n = mean(F1.n), F2.n = mean(F2.n))</code></pre>


---
layout: post
title: "Testing Figures"
comments: true
date: 2015-02-26 12:44:00
author: [{name: "Joe", url: "jofrhwld.github.io"}]
---
  

I'm not sure if I'm doing figures right.


<pre><code class="prettyprint ">  library(ggplot2)
  library(dplyr)
  library(magrittr)

  faithful %&lt;&gt;%
    mutate(clust = kmeans(., centers = 2) %&gt;% extract2(&quot;cluster&quot;) %&gt;% factor())


  ggplot(faithful, aes(waiting, eruptions, color = clust))+
    geom_point()</code></pre>

![center]({{site.baseurl}}/figs/2015-2-26-test_figsunnamed-chunk-1.svg) 

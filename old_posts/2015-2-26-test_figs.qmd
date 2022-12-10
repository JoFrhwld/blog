---
layout: post
title: "Testing Figures"
comments: true
date: 2015-06-12 16:30:34
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

![center]({{site.baseurl}}/figs/2015-2-26-test_figsunnamed-chunk-1-1.svg) 

## Update

So, I had to get knitr to save the figure file to one directory, but call it another in the code. That is, knitr would insert this line into the markdown:

    ![alt text]({{site.baseurl}}/figs/figure.png)
    
And what I needed it to insert was

    ![alt text]({{ "{{ site.baseurl " }}}}/figs/figure.png)

So I just hacked the hell out of it by reading in the output of `render_jekyll()`, doing a regex substition, and writing it back out again.

It's so ugly. You can check it out here: [https://github.com/JoFrhwld/blog/blob/gh-pages/knit_post.R#L7](https://github.com/JoFrhwld/blog/blob/gh-pages/knit_post.R#L7)
    

---
layout: post
title: "Using sqldf to load subsets of data"
comments: true
date: 2014-5-23 16:50:00 
author: [{name: "Joe", url: "jofrhwld.github.io"}]
---

Like many sociolinguists, I have a lot of vowel formant data which is stored in separate files for each speaker.
For example, I've organized my copy of the Philadelphia Neighborhood Corpus as follows:

    Street_1/
        Speaker_1/ 
            Speaker_1_meas.txt
        Speaker_2/
            Speaker_2_meas.txt
    Street_2/
        Speaker_3/
            Speaker_3_meas.txt
        Speaker_4/
            Speaker_4_meas.txt
            
It's easy enough to load all of one speakers' data into R.


<pre><code class="prettyprint ">df &lt;- read.delim(&quot;Street_1/Speaker_1/Speaker_1_meas.txt&quot;)</code></pre>


It's also easy enough, using `plyr`, to read in all of the data from all speakers by globbing for the measurement files.




<pre><code class="prettyprint ">library(plyr)
speakers &lt;- Sys.glob(&quot;Street*/Speaker*/*_meas.txt&quot;)
df &lt;- ldply(speakers, read.delim)</code></pre>


But with this plyr approach, I start facing two problems.

1. There are just about 1 million measurements in the whole PNC, and reading all of that into R's memory can start making things a little bit wonky. 
2. I don't actually want or need *all* of the data anyway.I frequently only want some vowel data from some speakers, and sometimes the data I want is even narrower than that.

My previous solution to these problems has been pretty hacky and inflexible. But now, I think I've got something better going with `sqldf`. Briefly, the `sqldf` package, and its namesake function, `sqldf()`, allows you to read data from a delimited file using SQL queries. I'm totally new to SQL, but [its Wikipedia page](https://en.wikipedia.org/wiki/SQL) is surprisingly useful for learning how to use it.

First, you need to assign the file connection to the speaker's data to a named variable.



<pre><code class="prettyprint ">speaker &lt;- &quot;Street_1/Speaker_1/Speaker_1_meas.txt&quot;
fi &lt;- file(speaker)</code></pre>


Now, you can use `sqldf()` to read in a specific data from the file connection using SQL queries. Here's a simple one where I selected just the vowel /ow/. The bit that says `plt_vclass` is referring to a column called `plt_vclass` which exists in the data.


<pre><code class="prettyprint ">  library(sqldf)
  df &lt;- sqldf(&quot;select * from fi where plt_vclass == 'ow'&quot;,
              file.format = list(header = TRUE, sep = &quot;\t&quot;))

  # good practice to close the connection
  close(fi)

  table(df$plt_vclass)</code></pre>



<pre><code>## 
##  ow 
## 145
</code></pre>



<pre><code class="prettyprint ">  summary(df$F2)</code></pre>



<pre><code>##    Min. 1st Qu.  Median    Mean 3rd Qu.    Max. 
##     824    1130    1230    1240    1330    1640
</code></pre>


I could've done something more fancy, where I select /uw/ and /ow/ with duration greater than 100ms.


<pre><code class="prettyprint ">  # re-open connection
  fi &lt;- file(speaker)  

  df &lt;- sqldf(&quot;select * from fi where plt_vclass in ('ow', 'uw') and dur &gt; 0.1&quot;,
              file.format = list(header = TRUE, sep = &quot;\t&quot;))
  close(fi)

  table(df$plt_vclass)</code></pre>



<pre><code>## 
## ow uw 
## 52 10
</code></pre>



<pre><code class="prettyprint ">  ddply(df, .(plt_vclass), 
        summarise, 
        mean_F2 = mean(F2),
        min_dur = min(dur))</code></pre>



<pre><code>##   plt_vclass mean_F2 min_dur
## 1         ow  1254.2   0.101
## 2         uw   912.5   0.101
</code></pre>


The trick now is how to do this over and over again with a list of files, and with any arbitrary conditions.
Here's the function I've come up with.

<script src="https://gist.github.com/JoFrhwld/26c42b35a5b4fc5a5bb8.js"></script>

To use it, first get a list of speakers' data files by globbing for them.

<pre><code class="prettyprint ">speakers &lt;- Sys.glob(&quot;Street*/Speaker*/*_meas.txt&quot;)</code></pre>




Now, feed this vector of file names into `ldply()`.





<pre><code class="prettyprint ">  df &lt;- ldply(speakers, 
              sql_load, 
              condition = &quot;where plt_vclass in ('ow', 'uw') and dur &gt; 0.1&quot;)
  
  table(df$plt_vclass)</code></pre>



<pre><code>## 
##    ow    uw 
## 11819  2539
</code></pre>



<pre><code class="prettyprint ">  ddply(df, .(plt_vclass), 
        summarise, 
        mean_F2 = mean(F2),
        min_dur = min(dur))</code></pre>



<pre><code>##   plt_vclass mean_F2 min_dur
## 1         ow    1267   0.101
## 2         uw    1151   0.101
</code></pre>


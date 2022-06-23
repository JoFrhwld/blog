---
layout: post
title: "Tidy Data, Split-Apply-Combine, and Vowel Data: Part 1"
comments: true
date: 2015-06-13 17:11:22
author: [{name: "Joe", url: "jofrhwld.github.io"}]
---


I've been thinking a bit about principles of [Tidy Data](http://www.jstatsoft.org/v59/i10/paper), the [Split-Apply-Combine strategy for data analysis](http://www.jstatsoft.org/v40/i01/paper), and how they apply to the kind of data I work with most of the time.  I think walking through some of the vowel normalization methods sociolinguists tend to use makes for a good example case for exploring these principles.
This will be a two part post, first focusing on Tidy Data.


# Tidy Data
The three principles of Tidy Data are:

1. Every variable has a column
2. Every row is an observation
3. Each type of observational unit forms a table.

It's probably best to discuss these principles in the context of a specific data set. I'll be using the Peterson & Barney vowels.


<pre><code class="prettyprint ">  library(downloader)
  library(knitr)
  library(dplyr)
  library(magrittr)
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

  ## clean up the pb data a bit
  ## - rename columns,
  ## - recode sex to be a factor
  ## - eliminate some cruft
  ## - add a unique id for each vowel
  pb_data %&lt;&gt;%
    set_colnames(c(&quot;sex&quot;, &quot;speaker&quot;, &quot;phonN&quot;, &quot;phon&quot;, 
                   &quot;F0&quot;, &quot;F1&quot;, &quot;F2&quot;, &quot;F3&quot;)) %&gt;%
    mutate(sex = factor(sex, labels = c(&quot;M&quot;,&quot;F&quot;,&quot;C&quot;)),
           phon = gsub(&quot;\\*&quot;, &quot;&quot;, phon)) %&gt;%
    select(sex, speaker, phon, F0, F1, F2, F3) %&gt;%
    mutate(id = 1:n())  </code></pre>

I'll be using functionality from `dplyr`, `magrittr` and `tidyr`.

**`tidyr`**
- Functions for turning columns to rows and rows to columns.
- functions `gather()`, `spread()`, and `separate()` used here.

**`dplyr`**
- Functions for implementing Split-Apply-Combine
- `group_by()`, `summarise()`, `mutate()`, `filter()`, `select()`, and `left_join()` used here.

**`magrittr`**
- Additional piping functionality.
- `%>%`, `set_colnames()`, `multiply_by()`, `subtract()`, `divide_by()`, and lambda notation used here.

## Vowels and Tidy Data

Looking at the Peterson and Barney data, it looks fairly tidy.


<pre><code class="prettyprint ">  pb_data %&gt;%
    head()</code></pre>



<pre><code>##   sex speaker phon  F0  F1   F2   F3 id
## 1   M       1   IY 160 240 2280 2850  1
## 2   M       1   IY 186 280 2400 2790  2
## 3   M       1   IH 203 390 2030 2640  3
## 4   M       1   IH 192 310 1980 2550  4
## 5   M       1   EH 161 490 1870 2420  5
## 6   M       1   EH 155 570 1700 2600  6
</code></pre>

So let's convert it to what would unambiguously be considered "messy" data. I'll estimate mean F1 and F2 values for each vowel, and then create a column for each vowel.


<pre><code class="prettyprint ">  pb_data %&gt;%
    select(sex, speaker, id, phon, F1, F2) %&gt;%
    gather(formant, hz, F1:F2) %&gt;%
    group_by(sex, speaker, phon, formant) %&gt;%
    summarise(hz = mean(hz)) %&gt;%
    mutate(vowel_formant = paste(phon, formant, sep = &quot;_&quot;)) %&gt;%
    ungroup() %&gt;%
    select(-formant, -phon)%&gt;%
    spread(vowel_formant, hz)-&gt;pb_messy
  
  pb_messy</code></pre>



<pre><code>## # A tibble: 76 x 22
##       sex speaker AA_F1 AA_F2 AE_F1  AE_F2 AH_F1  AH_F2 AO_F1 AO_F2 EH_F1
## *  &lt;fctr&gt;   &lt;int&gt; &lt;dbl&gt; &lt;dbl&gt; &lt;dbl&gt;  &lt;dbl&gt; &lt;dbl&gt;  &lt;dbl&gt; &lt;dbl&gt; &lt;dbl&gt; &lt;dbl&gt;
## 1       M       1 770.0  1065 595.0 1760.0 605.0 1275.0 630.0 975.0 530.0
## 2       M       2 660.0  1070 695.0 1650.0 637.5 1070.0 570.0 570.0 505.0
## 3       M       3 680.0  1085 644.0 1732.5 606.0 1180.0 545.0 855.0 545.0
## 4       M       4 775.0  1110 760.0 1595.0 667.5 1170.0 547.5 870.0 562.5
## 5       M       5 740.0  1240 790.0 1705.0 640.0 1235.0 545.0 925.0 565.0
## 6       M       6 705.0  1030 700.5 1678.5 703.0 1210.0 690.0 995.0 585.0
## 7       M       7 650.0   975 757.5 1805.0 630.0 1245.0 470.0 760.0 622.0
## 8       M       8 682.0  1160 533.0 1940.0 632.0 1325.0 584.0 967.5 472.5
## 9       M       9 706.5  1052 591.0 1762.5 633.5 1122.5 607.0 854.0 584.0
## 10      M      10 763.5  1053 642.0 1675.0 661.0 1240.0 582.5 809.5 500.0
## # ... with 66 more rows, and 11 more variables: EH_F2 &lt;dbl&gt;, ER_F1 &lt;dbl&gt;,
## #   ER_F2 &lt;dbl&gt;, IH_F1 &lt;dbl&gt;, IH_F2 &lt;dbl&gt;, IY_F1 &lt;dbl&gt;, IY_F2 &lt;dbl&gt;,
## #   UH_F1 &lt;dbl&gt;, UH_F2 &lt;dbl&gt;, UW_F1 &lt;dbl&gt;, UW_F2 &lt;dbl&gt;
</code></pre>

I have seen vowel formant data stored in this kind of format before, and it definitely counts as "messy". Looking at this data set, there are the following variables:

- speaker identity
- speaker sex
- vowel measured
- vowel F1
- vowel F2

And one observation is

- The F1 and F2 of each vowel for each speaker.

But, there are actually three different variables smushed together along the columns, Vowel + (F1,F2), and there are multiple observations per row. We definitely don't want to store data or work with data in this format. If you already have data in this format, or have the misfortune of needing to work with data in this format, it's easy enough to convert this data to a tidyier format.

**Step 1:** "gather" the data into a long format.

<pre><code class="prettyprint ">  pb_messy %&gt;%
    gather(vowel_formant, hz, AA_F1:UW_F2)-&gt;pb_gathered
  
  pb_gathered</code></pre>



<pre><code>## # A tibble: 1,520 x 4
##       sex speaker vowel_formant    hz
##    &lt;fctr&gt;   &lt;int&gt;         &lt;chr&gt; &lt;dbl&gt;
## 1       M       1         AA_F1 770.0
## 2       M       2         AA_F1 660.0
## 3       M       3         AA_F1 680.0
## 4       M       4         AA_F1 775.0
## 5       M       5         AA_F1 740.0
## 6       M       6         AA_F1 705.0
## 7       M       7         AA_F1 650.0
## 8       M       8         AA_F1 682.0
## 9       M       9         AA_F1 706.5
## 10      M      10         AA_F1 763.5
## # ... with 1,510 more rows
</code></pre>

**Step 2:** Separate the vowel + formant column into two separate variables

<pre><code class="prettyprint ">  pb_gathered %&gt;%
    separate(vowel_formant, 
             into = c(&quot;vowel&quot;,&quot;formant&quot;), 
             sep = &quot;_&quot;)-&gt;pb_gathered_split
  
  pb_gathered_split</code></pre>



<pre><code>## # A tibble: 1,520 x 5
##       sex speaker vowel formant    hz
## *  &lt;fctr&gt;   &lt;int&gt; &lt;chr&gt;   &lt;chr&gt; &lt;dbl&gt;
## 1       M       1    AA      F1 770.0
## 2       M       2    AA      F1 660.0
## 3       M       3    AA      F1 680.0
## 4       M       4    AA      F1 775.0
## 5       M       5    AA      F1 740.0
## 6       M       6    AA      F1 705.0
## 7       M       7    AA      F1 650.0
## 8       M       8    AA      F1 682.0
## 9       M       9    AA      F1 706.5
## 10      M      10    AA      F1 763.5
## # ... with 1,510 more rows
</code></pre>

**Step 3**: Use the values in the `formant` column as column names of their own.

<pre><code class="prettyprint ">  pb_gathered_split%&gt;%
    spread(formant, hz)-&gt;pb_spread
  
  pb_spread</code></pre>



<pre><code>## # A tibble: 760 x 5
##       sex speaker vowel    F1    F2
## *  &lt;fctr&gt;   &lt;int&gt; &lt;chr&gt; &lt;dbl&gt; &lt;dbl&gt;
## 1       M       1    AA   770  1065
## 2       M       1    AE   595  1760
## 3       M       1    AH   605  1275
## 4       M       1    AO   630   975
## 5       M       1    EH   530  1785
## 6       M       1    ER   415  1425
## 7       M       1    IH   350  2005
## 8       M       1    IY   260  2340
## 9       M       1    UH   420  1095
## 10      M       1    UW   255   985
## # ... with 750 more rows
</code></pre>

And with the magic of `%>%`, you can do all three in one long chain.


<pre><code class="prettyprint ">  pb_messy %&gt;%
    gather(vowel_formant, hz, AA_F1:UW_F2)%&gt;%
    separate(vowel_formant, 
             into = c(&quot;vowel&quot;,&quot;formant&quot;), 
             sep = &quot;_&quot;)%&gt;%
    spread(formant, hz)</code></pre>



<pre><code>## # A tibble: 760 x 5
##       sex speaker vowel    F1    F2
## *  &lt;fctr&gt;   &lt;int&gt; &lt;chr&gt; &lt;dbl&gt; &lt;dbl&gt;
## 1       M       1    AA   770  1065
## 2       M       1    AE   595  1760
## 3       M       1    AH   605  1275
## 4       M       1    AO   630   975
## 5       M       1    EH   530  1785
## 6       M       1    ER   415  1425
## 7       M       1    IH   350  2005
## 8       M       1    IY   260  2340
## 9       M       1    UH   420  1095
## 10      M       1    UW   255   985
## # ... with 750 more rows
</code></pre>

Now, it's a lot easier to make the classing F2xF1 plot.


<pre><code class="prettyprint ">  pb_spread %&gt;%
    ggplot(aes(F2, F1, color = sex))+
      geom_point()+
      scale_y_reverse()+
      scale_x_reverse()+
      coord_fixed()</code></pre>

![center]({{site.baseurl}}/figs//normal_grittrpb_plot-1.svg)



## What *is* an observation?

When I described the variables in the data, and what counted as an observation, I was assuming, like I think most sociolinguists do, that one "observation" is one vowel, and that we have multiple different kinds of measurements per vowel (F1, F2, duration, etc.).
However, as I think will be made clearer in the next post on normalization, some techniques actually assume a finer grained "observation" than that.
Let's look at the relatively tidy raw Peterson & Barney data.


<pre><code class="prettyprint ">  pb_data %&gt;%
    tbl_df()</code></pre>



<pre><code>## # A tibble: 1,520 x 8
##       sex speaker  phon    F0    F1    F2    F3    id
##    &lt;fctr&gt;   &lt;int&gt; &lt;chr&gt; &lt;dbl&gt; &lt;dbl&gt; &lt;dbl&gt; &lt;dbl&gt; &lt;int&gt;
## 1       M       1    IY   160   240  2280  2850     1
## 2       M       1    IY   186   280  2400  2790     2
## 3       M       1    IH   203   390  2030  2640     3
## 4       M       1    IH   192   310  1980  2550     4
## 5       M       1    EH   161   490  1870  2420     5
## 6       M       1    EH   155   570  1700  2600     6
## 7       M       1    AE   140   560  1820  2660     7
## 8       M       1    AE   180   630  1700  2550     8
## 9       M       1    AH   144   590  1250  2620     9
## 10      M       1    AH   148   620  1300  2530    10
## # ... with 1,510 more rows
</code></pre>

We *could* identify the following variables:

- speaker identity
- speaker sex
- vowel measure id
- vowel label
- formant estimated
- value in hz

And we *could* define an observation as:

- One hz value from one formant for one vowel measured from one speaker.

Under this definition of the variables and observations, one of the variables (the vowel which was measured) is spread out along the columns.
Let's apply the tidying approach I described above:


<pre><code class="prettyprint ">  pb_data %&gt;% 
    tbl_df() %&gt;%
    gather(formant, hz, F0:F3) -&gt; pb_long
  
  pb_long</code></pre>



<pre><code>## # A tibble: 6,080 x 6
##       sex speaker  phon    id formant    hz
##    &lt;fctr&gt;   &lt;int&gt; &lt;chr&gt; &lt;int&gt;   &lt;chr&gt; &lt;dbl&gt;
## 1       M       1    IY     1      F0   160
## 2       M       1    IY     2      F0   186
## 3       M       1    IH     3      F0   203
## 4       M       1    IH     4      F0   192
## 5       M       1    EH     5      F0   161
## 6       M       1    EH     6      F0   155
## 7       M       1    AE     7      F0   140
## 8       M       1    AE     8      F0   180
## 9       M       1    AH     9      F0   144
## 10      M       1    AH    10      F0   148
## # ... with 6,070 more rows
</code></pre>

Why would you want to have your data in this kind for weird format? Well, for one, as I'll demonstrate in the next post, it makes it a bit easier to do some kinds of vowel normalization that require you to estimate the mean of F1 and F2 together (like the ANAE method, or versions of Nearey normalization).
Second, this can be a relatively interesting format of its own. 



<pre><code class="prettyprint ">  pb_long %&gt;%
    filter(phon %in% c(&quot;IY&quot;,&quot;AE&quot;,&quot;AA&quot;))%&gt;%
    group_by(phon, formant, sex, speaker)%&gt;%
    summarise(hz = mean(hz)) %&gt;%
    summarise(hz = mean(hz)) %&gt;%
    ggplot(aes(formant, hz, color = phon))+
      geom_line(aes(group = phon))+
      facet_wrap(~sex)</code></pre>

![center]({{site.baseurl}}/figs//normal_grittrunnamed-chunk-10-1.svg)

---

*Edit August 8, 2016*: Spelling 

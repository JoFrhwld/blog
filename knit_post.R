my_svg <- function(file, width, height) {
  library(RSvgDevice)
  devSVG(file = file, width = width, height = height, bg = "transparent", fg = "black",
         onefile = TRUE, xmlHeader = TRUE)
}

inject_liquid <- function(mdfile){
  inConn <- file(mdfile)
  lines <- readLines(inConn)
  close(inConn)

  for(idx in seq(along=lines)){
    lines[idx] <- gsub("(!\\[.+\\]\\()(/figs)", "\\1{{site.baseurl}}\\2", lines[idx])
  }
  outConn <- file(mdfile)
  writeLines(lines, outConn)
  close(outConn)
}

knit_post <- function(input, outdir = NULL, base.url = "/", fig.dir = NULL) {
  require(knitr)
  if(is.null(outdir)){
    output <- sub(".Rmd$",".md",input)
  }else{
    output <- file.path(outdir, sub(".Rmd$", ".md", basename(input)))
  }
  opts_knit$set(base.url = base.url)
  if(is.null(fig.dir)){
    fig.path <- file.path("/figs", sub(".Rmd$", "", basename(input)))
  }else{
    fig.path <- file.path(fig.dir, sub(".Rmd$", "", basename(input))) 
  }
  opts_chunk$set(fig.path = fig.path)
  opts_chunk$set(fig.cap = "center")
  render_jekyll(highlight="prettify")
  knit(input, output=output, envir = parent.frame())
  inject_liquid(output)
}



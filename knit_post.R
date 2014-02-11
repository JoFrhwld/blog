knit_post <- function(input, outdir = NULL, base.url = "/") {
  require(knitr)
  if(is.null(outdir)){
    output <- sub(".Rmd$",".md",input)
  }else{
    output <- file.path(outdir, sub(".Rmd$", ".md", basename(input)))
  }
  opts_knit$set(base.url = base.url)
  fig.path <- file.path(outdir, "figs", sub(".Rmd$", "", basename(input)))
  opts_chunk$set(fig.path = fig.path)
  opts_chunk$set(fig.cap = "center")
  render_jekyll(highlight="prettify")
  knit(input, output=output, envir = parent.frame())
}
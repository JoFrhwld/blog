my_svg <- function(file, width, height) {
  library(RSvgDevice)
  devSVG(file = file, width = width, height = height, bg = "transparent", fg = "black",
         onefile = TRUE, xmlHeader = TRUE)
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
    fig.path <- file.path(outdir, "figs", sub(".Rmd$", "", basename(input)))
  }else{
    fig.path <- file.path(fig.dir, sub(".Rmd$", "", basename(input))) 
  }
  opts_chunk$set(fig.path = fig.path)
  opts_chunk$set(fig.cap = "center")
  render_jekyll(highlight="prettify")
  knit(input, output=output, envir = parent.frame())
}
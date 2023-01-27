source("renv/activate.R")
library(ggplot2)
library(ggdark)
library(showtext)
library(colorspace)

# get Fira Sans from google
font_add_google(name = "Fira Sans", family = "Fira Sans")
showtext_auto()

# Set global variable for setting fonts
# that aren't set by theme(text=...)
PLOT_FONT <- "Fira Sans"


# from the theme _variables.scss
body_bg <- "#222222"
plot_bg <- darken("#375a7f", 0.50)
major <- lighten(
  plot_bg,
  amount = 0.25
)
minor <- lighten(
  plot_bg,
  amount = 0.125
)
strip_bg <- lighten(plot_bg, 0.5)




theme_set(dark_theme_gray(base_size = 12) + 
            theme(text = element_text(family = "Fira Sans"),
                  plot.background = element_rect(fill = plot_bg),
                  panel.background = element_blank(),
                  panel.grid.major = element_line(color = major, linewidth = 0.2),
                  panel.grid.minor = element_line(color = minor, linewidth = 0.2),
                  legend.key = element_blank(),
                  strip.background = element_rect(fill = strip_bg),
                  strip.text = element_text(color = body_bg),
                  axis.ticks = element_blank(),
                  legend.background = element_blank()))

# set a crop: true hook
knitr::knit_hooks$set(crop = knitr::hook_pdfcrop)

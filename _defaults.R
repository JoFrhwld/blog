library(ggplot2)
library(ggdark)
library(showtext)
library(colorspace)
library(ggthemes)

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

ptol_red <- "#EE6677"
ptol_blue <- "#4477AA"


theme_set(theme_minimal(base_size = 16) + 
            theme(text = element_text(family = "Fira Sans"),
                  #plot.background = element_rect(fill = plot_bg),
                  panel.background = element_blank(),
                  panel.grid = element_blank(),
                  legend.key = element_blank(),
                  #strip.background = element_rect(fill = strip_bg),
                  #strip.text = element_text(color = "white"),
                  axis.ticks = element_blank(),
                  legend.background = element_blank()))

theme_no_y <- function(){
  theme(
    axis.text.y = element_blank(),
    axis.title.y = element_blank(),
    panel.grid.major.y = element_blank()
  )
}

theme_no_x <- function(){
  theme(
    axis.text.x = element_blank(),
    axis.title.x = element_blank(),
    panel.grid.major.x = element_blank()
  )
}

options(
  ggplot2.discrete.colour = lapply(1:12, ggthemes::ptol_pal()),
  ggplot2.discrete.fill = lapply(1:12, ggthemes::ptol_pal()),
  ggplot2.ordinal.colour = \(...) scale_color_viridis_d(option = "G", direction = -1, ...),
  ggplot2.ordinal.fill = \(...) scale_fill_viridis_d(option = "G", direction = -1, ...),  
  ggplot2.continuous.colour = \(...) scico::scale_color_scico(palette = "batlow", ...),
  ggplot2.continuous.fill = \(...) scico::scale_fill_scico(palette = "batlow", ...)
)

# set a crop: true hook
knitr::knit_hooks$set(crop = knitr::hook_pdfcrop)
library(ggplot2)
library(ggdark)
library(showtext)
library(colorspace)
library(ggthemes)
library(gt)

# get plot fonts
font_add_google(name = "Public Sans", family = "Public Sans")
showtext_auto()

# Set global variable for setting fonts
# that aren't set by theme(text=...)
PLOT_FONT <- "Public Sans"


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
            theme(text = element_text(family = "Public Sans"),
                  plot.background = element_rect(fill = "white", colour = NA),
                  panel.background = element_rect(fill = "white", colour = NA),                  
                  panel.grid = element_blank(),
                  legend.key = element_blank(),
                  #strip.background = element_rect(fill = strip_bg),
                  #strip.text = element_text(color = "white"),
                  axis.ticks = element_blank(),
                  axis.line = element_line(color = "grey60", linewidth = 0.2),
                  legend.background = element_blank()))

theme_dark <- function(){
  theme(
    #panel.border = element_blank(),
    text = element_text(family = "Public Sans", colour = "white"),
    axis.text = element_text(colour = "white"),
    rect = element_rect(colour = "#222", fill = "#222"),
    plot.background = element_rect(fill = "#222", colour = NA),
    panel.background = element_rect(fill = "#424952"),
    strip.background = element_rect(fill="#3d3d3d"),
    strip.text = element_text(color = "white")
  )
}



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

out2fig = function(out.width, out.width.default = 0.7, fig.width.default = 6) {
  fig.width.default * out.width / out.width.default 
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


# dark gt theme
dark_gt_theme <- function(tbl){
  
  style_cells <- list(
    cells_body(),
    cells_column_labels(),
    cells_column_spanners(),
    cells_footnotes(),
    cells_row_groups(),
    cells_source_notes(),
    cells_stub(),
    cells_stubhead(),
    cells_title()
  )
  
  summary_info <- tbl$`_summary` |> 
    map(
      ~":GRAND_SUMMARY:" %in% .x$groups
    )  |> 
    list_simplify()
  
  if(any(summary_info)){
    style_cells <- c(
      style_cells,
      list(
        cells_grand_summary(),
        cells_stub_grand_summary()
      )
    )
  }
  
  if(any(!(summary_info %||% T))){
    style_cells <- c(
      style_cells,
      list(
        cells_stub_summary(),
        cells_summary()
      )
    )
  }
  
  tbl |> 
    opt_table_font(
      font = c(
        google_font(name = "Public Sans"),
        default_fonts()
      )
    )|> 
    tab_style(
      style = "
        background-color: var(--bs-body-bg);
        color: var(--bs-body-color)
      ",
      locations = style_cells
    ) 
}
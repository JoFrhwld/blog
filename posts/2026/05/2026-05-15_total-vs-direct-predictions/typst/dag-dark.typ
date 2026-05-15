#import "@preview/fletcher:0.5.8" as fletcher: diagram, node, edge

#let paper = (white, rgb("#222"))
#let ink  = (black, white)
#let col = 1

#set text(size: 20pt, fill: ink.at(col))
#set page(margin: 1em, width: auto, height: auto, fill: paper.at(col))
#let pgreen = rgb("#228833")
#let pred = rgb("FFCCCC")
#let pblue = rgb("#BBCCEE")
#let pmag = rgb("#aa3377")

#diagram(
  node-stroke: 1pt+ink.at(col),
  node-corner-radius: 5pt,
  node-inset: 0.5em,
  edge-stroke: 2pt+ink.at(col),
  node((0,0), "categorical"),
  node((1,1), "continuous"),
  node((2,0), "y"),
  edge((0,0), (2,0), "-|>"),
  edge((0,0), (1,1), "-|>"),
  edge((1,1), (2,0), "-|>")
)

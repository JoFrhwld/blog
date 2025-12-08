#import "@preview/fletcher:0.5.8" as fletcher: diagram, node, edge

#let paper = (white, rgb("#222"))
#let ink  = (black, white)
#let col = 0

#set text(size: 20pt, fill: ink.at(col))
#set page(margin: 1em, width: auto, height: auto, fill: paper.at(col))
#let pgreen = rgb("#228833")
#let pred = rgb("FFCCCC")
#let pblue = rgb("#BBCCEE")
#let pmag = rgb("#aa3377")

#diagram(
  node-stroke: 1pt+ink.at(col),
  node-shape: "rect",
  node-inset: 0.5em,
  edge-stroke: 2pt+ink.at(col),
  node((0,0), "weight", name: "weight"),
  node((0,2), "height", name: "height"),  
  node((1,1), "BMI", name: "bmi", extrude: (-4,0)),
  node((2,1), "outcome", name: "outcome"),
  edge(<weight>, <bmi>, "=>"),
  edge(<height>, <bmi>, "=>"),
  edge(<bmi>, <outcome>, "--|>")
)

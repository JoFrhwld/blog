#import "@preview/fletcher:0.5.8" as fletcher: (
  diagram, 
  node, 
  edge, 
  shapes
)
#set page(
  width: auto,
  height: auto, 
  margin: 5mm, 
  fill: white
)

#let nodes = ("A", "B", "C", "D", "E")

#diagram({
  for (i, n) in nodes.enumerate() {
    let θ = 90deg - i*360deg/nodes.len()
    node((θ, 18mm), n, stroke: 0.5pt, name: str(i))
  }
})
#import "@preview/fletcher:0.5.8" as fletcher: (
  diagram, 
  node, 
  edge
)

#set page(
  width: auto,
  height: auto, 
  margin: 5mm, 
  fill: rgb("#222")
)
#set text(fill: white)

#let nodes = range(20).map(x => str(x))

#diagram({
  for (i, n) in nodes.enumerate() {
    let θ = 90deg - i*360deg/nodes.len()
    node((θ, 18mm), n, stroke: 0.5pt+white, name: str(i))
  }
})
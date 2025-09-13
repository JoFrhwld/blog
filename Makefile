UNAME := $(shell uname)

ifeq ($(UNAME),Darwin)
	TYPST=~/.local/bin/typst
else
	TYPST=/usr/local/bin/typst
endif

srces := $(wildcard posts/20*/*/20*/typst/*.typ)
targets := $(patsubst %.typ,%.svg,$(srces))

all: $(srces) $(targets)

%.svg: %.typ
	$(TYPST) compile --font-path fonts -f svg $< $@
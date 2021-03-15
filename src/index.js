import React from 'react';
import { render } from "react-dom";
import { DeckGL } from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { StaticMap } from 'react-map-gl';
import { BASEMAP } from '@deck.gl/carto';
import { feature } from 'topojson-client';
import chroma from "chroma-js";
import AbsoluteLegend from './AbsoluteLegend';
import { WebMercatorViewport } from '@deck.gl/core';
import bbox from "@turf/bbox";
import "./custom.css";

import Plot from 'react-plotly.js'

// Custom react-plotly
/*
import Plotly from '@uoa-eresearch/plotly.js/dist/plotly'
import createPlotlyComponent from 'react-plotly.js/factory';
const Plot = createPlotlyComponent(Plotly);
*/

import {
    ReflexContainer,
    ReflexSplitter,
    ReflexElement
} from 'react-reflex'
import 'react-reflex/styles.css'

function addObjects(a, b) {
    for (var k in b) {
        if (typeof (b[k]) == "number") {
            if (!a[k]) a[k] = 0;
            a[k] += b[k];
        } else if (typeof (b[k]) == "object") {
            if (!a[k]) a[k] = {}
            a[k] = addObjects(a[k], b[k])
        }
    }
    return a;
}

function aggregate(items) {
    var result = {}
    for (var item of items) {
        result = addObjects(result, item)
    }
    result["aggregate"] = true
    console.log("Aggregate calculated. Result:", result)
    return result;
}

function getViewStateForBounds(BOUNDS) {
    const viewport = new WebMercatorViewport({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    const { longitude, latitude, zoom } = viewport.fitBounds(BOUNDS, {
        padding: 100
    });
    return {
        longitude,
        latitude,
        zoom
    }
}

class DecklyComponent extends React.Component {

    constructor(props) {
        super(props);
        var accessor = this.props.colorBy;
        if (typeof (accessor) == "object") {
            var accessorName = Object.keys(accessor)[0];
            accessor = accessor[accessorName]
        }
        var legendTitle = this.props.legendTitle;
        if (typeof (legendTitle) == "object") {
            var accessorName = Object.keys(legendTitle)[0];
            legendTitle = legendTitle[accessorName]
        }
        this.state = {
            items: [],
            accessor: accessor,
            accessorName: accessorName,
            legendTitle: legendTitle,
            isLoaded: false,
            per: false,
            height: true, // if bivariate, should second variable be shown as height?
            animating: false, // true when shifting between height == True and height == False
            hoverInfo: {},
            limits: this.props.limits,
            selected: null,
            viewport: {}
        }
        this.handleInputChange = this.handleInputChange.bind(this);
        this.changeAccessor = this.changeAccessor.bind(this);
        this.toggleHeight = this.toggleHeight.bind(this);
        this.setAnimating = this.setAnimating.bind(this);
    }

    changeAccessor(accessorName) {
        this.setState({
            accessorName: accessorName,
            accessor: this.props.colorBy[accessorName],
            legendTitle: this.props.legendTitle[accessorName]
        })
    }

    toggleHeight() {
        this.setState({
            height: !this.state.height,
            animating: true
        })
    }

    setAnimating(animating) {
        this.setState({
            animating: animating
        })
    }

    componentDidMount() {
        document.title = this.props.title;
        fetch(this.props.data)
            .then(results => results.json())
            .then(json => {
                if (json.type == "Topology") {
                    json = feature(json, Object.keys(json.objects)[0]) // Convert topojson to geojson
                }
                var b = bbox(json);
                console.log("GeoJSON loaded:", json, "Bounds:", b);
                b = [
                    [b[0], b[1]],
                    [b[2], b[3]]
                ]
                this.setState({
                    isLoaded: true,
                    items: json.features,
                    aggregate: aggregate(json.features.map(f => f.properties)),
                    viewport: getViewStateForBounds(b)
                })
            });
    }

    handleInputChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;
        this.setState({
            [name]: value
        });
    }

    render() {

        if (!this.state.isLoaded) return null;

        const data = this.state.items.map(this.state.accessor)
        if (!this.props.limits) { // Unless the user manually passed in limits, calculate them
            if (typeof (data[0]) == "number") {
                this.state.limits = chroma.limits(data, 'e', 1)
            } else if (typeof (data[0]) == "object") {
                this.state.limits = [chroma.limits(data.map(v => v[0]), 'e', 1), chroma.limits(data.map(v => v[1]), 'e', 1)]
            }
            console.log("Colourmap limits:", this.state.limits)
        }
        var colorScale = this.props.colorScale;
        console.log("Render()", this.state)
        if (typeof (colorScale) == "string" || typeof (data[0]) == "number") {
            if (typeof (colorScale) == "object") {
                colorScale = colorScale[0]
            }
            colorScale = chroma.scale(colorScale).domain(this.state.limits)
        } else if (typeof (colorScale) == "object") { // Bivariate
            colorScale = [chroma.scale(colorScale[0]).domain(this.state.limits[0]), chroma.scale(colorScale[1]).domain(this.state.limits[1])]
        }

        const layers = [
            new GeoJsonLayer({
                id: 'geojson',
                data: this.state.items,
                opacity: 0.8,
                lineWidthUnits: "pixels",
                lineWidthMinPixels: 1,
                extruded: this.state.height || this.state.animating,
                wireframe: true,
                getElevation: this.state.height && typeof (colorScale) == "object" ?
                    f => (this.state.accessor(f)[1] - this.state.limits[1][0]) / this.state.limits[1][0] * 20000 : null,
                getLineWidth: f => f == this.state.selected ? 3 : 1,
                getFillColor: f => {if (typeof (colorScale) == "object"){
                    return this.state.height ? colorScale[0](this.state.accessor(f)[0]).rgb() : chroma.blend(colorScale[0](this.state.accessor(f)[0]), colorScale[1](this.state.accessor(f)[1]), "multiply").rgb()
                } else {
                    return colorScale(this.state.accessor(f)).rgb()
                }},
                getLineColor: f => f == this.state.selected ? [255, 69, 0] : [0, 0, 0],
                pickable: true,
                onHover: info => this.state.selected == null ? this.setState({ hoverInfo: info }) : null,
                onClick: info => this.state.selected == info.object ? this.setState({ selected: null }) : this.setState({ selected: info.object, hoverInfo: info }),
                transitions: {
                    getElevation: {
                        duration: 400,
                        onEnd: () => this.setAnimating(false) 
                    },
                    getFillColor: 400
                },
                updateTriggers: {
                    getLineWidth: this.state.selected,
                    getLineColor: this.state.selected,
                    getElevation: [this.state.height, this.state.accessor],
                    getFillColor: [this.state.accessor, this.state.height]
                },
            })
        ];

        return (
            <ReflexContainer orientation="horizontal">
                <ReflexElement className="title" maxSize={20}>
                    {this.props.title}
                </ReflexElement>
                <ReflexElement>
                    <ReflexContainer orientation="vertical">
                        <ReflexElement className="map">

                            <DeckGL initialViewState={this.state.viewport} controller={true} layers={layers}>
                                <StaticMap mapStyle={BASEMAP.POSITRON} />
                                {
                                    this.state.hoverInfo.object && (
                                        <div className="tooltip" style={{ position: 'absolute', zIndex: 1, pointerEvents: 'none', left: this.state.hoverInfo.x, top: this.state.hoverInfo.y }}>
                                            { this.props.hoverMessage(this.state.hoverInfo.object) + ": " + this.state.accessor(this.state.hoverInfo.object).toLocaleString()}
                                        </div>
                                    )
                                }
                                <AbsoluteLegend title={this.state.legendTitle} colorScale={colorScale} colorBy={this.props.colorBy} height={this.state.height} toggleHeight={this.toggleHeight} accessorName={this.state.accessorName} changeAccessor={this.changeAccessor} limits={this.state.limits} labels={this.props.legendLabels} steps={5} />
                            </DeckGL>
                        </ReflexElement>
                        <ReflexSplitter />
                        <ReflexElement className="plots">
                            <div id="controls">
                                {this.props.perText &&
                                    <div id="perWrapper">
                                        <input name="per" type="checkbox" checked={this.state.per} onChange={this.handleInputChange} />
                                        <label htmlFor="per">{this.props.perText}</label>
                                    </div>
                                }
                            </div>
                            {
                                this.props.plots.map(p => {
                                    var data = this.state.hoverInfo.object ? this.state.hoverInfo.object.properties : this.state.aggregate;
                                    data.aggregateData = this.state.aggregate;
                                    data.hoverObject = this.state.hoverInfo.object;
                                    if (!p.style) p.style = {}
                                    const DEFAULT_STYLE = {
                                        width: "100%",
                                        height: "300px"
                                    }
                                    if (p.type == "PCP") {
                                        data = this.state.items;
                                        if (this.state.per) {
                                            console.log("preperfunc", data);
                                            data = data.map(f => this.props.perFunc(f))
                                            console.log("perfunc", data)
                                        }
                                        data = p.data(data, this.state.hoverInfo)
                                    } else {
                                        if (this.state.per) {
                                            data = this.props.perFunc(data)
                                        }
                                        data = p.data(data);
                                    }
                                    return <Plot
                                        key={p.id}
                                        data={data}
                                        layout={{
                                            ...p.layout,
                                            title: p.layout.title(this.state.hoverInfo.object),
                                            barmode: 'stack',
                                        }}
                                        useResizeHandler={true}
                                        style={{ ...DEFAULT_STYLE, ...p.style }}
                                        onHover={d => this.setState({ "plotly_hover": d })}
                                    />
                                })
                            }
                        </ReflexElement>
                    </ReflexContainer>
                </ReflexElement>
            </ReflexContainer>
        )
    }
}

export default function Deckly(props) {
    document.body.innerHTML = "<div id='root'></div>"
    render(<DecklyComponent {...props} />, document.querySelector("#root"));
}
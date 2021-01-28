import React from 'react';
import { render } from "react-dom";
import { DeckGL } from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { StaticMap } from 'react-map-gl';
import { BASEMAP } from '@deck.gl/carto';
import { feature } from 'topojson-client';
import chroma from "chroma-js";
import Plot from 'react-plotly.js';
import AbsoluteLegend from './AbsoluteLegend';
import { WebMercatorViewport } from '@deck.gl/core';
import bbox from "@turf/bbox";
import "./custom.css";

import {
    ReflexContainer,
    ReflexSplitter,
    ReflexElement
} from 'react-reflex'
import 'react-reflex/styles.css'

function aggregate(items) {
    var result = {}
    for (var item of items) {
        for (var k in item) {
            var v = item[k]
            if (typeof (v) == "object") {
                if (!result[k]) result[k] = {}
                for (var sk in v) {
                    if (typeof (v[sk]) == "object") {
                        for (var ssk in v[sk]) {
                            if (!result[k][sk]) result[k][sk] = {};
                            if (!result[k][sk][ssk]) result[k][sk][ssk] = 0;
                            result[k][sk][ssk] += v[sk][ssk]
                        }
                    } else if (typeof (v[sk]) == "number") {
                        if (!result[k][sk]) result[k][sk] = 0;
                        result[k][sk] += v[sk]
                    }
                }
            } else if (typeof (v) == "number") {
                if (!result[k]) result[k] = 0;
                result[k] += v
            }
        }
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
        this.state = {
            items: [],
            accessor: this.props.colorBy,
            isLoaded: false,
            per: false,
            hoverInfo: {},
            limits: this.props.limits,
            selected: null,
            viewport: {}
        }
        this.handleInputChange = this.handleInputChange.bind(this);
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
        if (!this.state.limits) {
            if (typeof (data[0]) == "number") {
                this.state.limits = chroma.limits(data, 'e', 1)
            } else if (typeof (data[0]) == "object") {
                this.state.limits = [chroma.limits(data.map(v => v[0]), 'e', 1), chroma.limits(data.map(v => v[1]), 'e', 1)]
            }
            console.log("Colourmap limits:", this.state.limits)
        }
        var COLOR_SCALE;
        if (typeof (this.props.colorScale) == "string") {
            COLOR_SCALE = chroma.scale(this.props.colorScale).domain(this.state.limits)
        } else if (typeof (this.props.colorScale) == "object") { // Bivariate
            COLOR_SCALE = [chroma.scale(this.props.colorScale[0]).domain(this.state.limits[0]), chroma.scale(this.props.colorScale[1]).domain(this.state.limits[1])]
        }
        const layers = [
            new GeoJsonLayer({
                id: 'geojson',
                data: this.state.items,
                opacity: 0.8,
                lineWidthUnits: "pixels",
                lineWidthMinPixels: 1,
                getLineWidth: f => f == this.state.selected ? 3 : 1,
                getFillColor: f => typeof (COLOR_SCALE) == "object" ?
                    chroma.blend(COLOR_SCALE[0](this.state.accessor(f)[0]), COLOR_SCALE[1](this.state.accessor(f)[1]), "multiply").rgb() :
                    COLOR_SCALE(this.state.accessor(f)).rgb(),
                getLineColor: f => f == this.state.selected ? [255, 69, 0] : [0, 0, 0],
                pickable: true,
                onHover: info => this.state.selected == null ? this.setState({ hoverInfo: info }) : null,
                onClick: info => this.state.selected == info.object ? this.setState({ selected: null }) : this.setState({ selected: info.object, hoverInfo: info }),
                updateTriggers: {
                    getLineWidth: this.state.selected,
                    getLineColor: this.state.selected
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
                                <StaticMap mapStyle={BASEMAP.DARK_MATTER} />
                                {
                                    this.state.hoverInfo.object && (
                                        <div className="tooltip" style={{ position: 'absolute', zIndex: 1, pointerEvents: 'none', left: this.state.hoverInfo.x, top: this.state.hoverInfo.y }}>
                                            { this.props.hoverMessage(this.state.hoverInfo.object) + ": " + this.props.colorBy(this.state.hoverInfo.object).toLocaleString()}
                                        </div>
                                    )
                                }
                                <AbsoluteLegend title={this.props.legendTitle} colorScale={COLOR_SCALE} limits={this.state.limits} labels={this.props.legendLabels} steps={5} />
                            </DeckGL>
                        </ReflexElement>
                        <ReflexSplitter />
                        <ReflexElement className="plots">
                            <div id="controls">
                                <input name="per" type="checkbox" checked={this.state.per} onChange={this.handleInputChange} />
                                <label htmlFor="per">{this.props.perText}</label>
                            </div>
                            {
                                this.props.plots.map(p => {
                                    var data = this.state.hoverInfo.object ? this.state.hoverInfo.object.properties : this.state.aggregate;
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
                                        return <Plot
                                            key={p.id}
                                            data={p.data(data, this.state.hoverInfo)}
                                            layout={{
                                                title: p.layout.title(this.state.hoverInfo.object),
                                            }}
                                            useResizeHandler={true}
                                            style={{...DEFAULT_STYLE, ...p.style}}
                                        />
                                    } else {
                                        if (this.state.per) {
                                            data = this.props.perFunc(data)
                                        }
                                        return <Plot
                                            key={p.id}
                                            data={p.data(data)}
                                            layout={{
                                                title: p.layout.title(this.state.hoverInfo.object),
                                                barmode: 'stack',
                                            }}
                                            useResizeHandler={true}
                                            style={{...DEFAULT_STYLE, ...p.style}}
                                        />
                                    }
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
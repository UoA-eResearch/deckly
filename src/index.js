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
import "./custom.css";

import {
    ReflexContainer,
    ReflexSplitter,
    ReflexElement
} from 'react-reflex'
import 'react-reflex/styles.css'

// Viewport settings
const INITIAL_VIEW_STATE = {
    longitude: 172.5118422,
    latitude: -41.235726,
    zoom: 5,
    pitch: 0,
    bearing: 0
};

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
                    } else if (typeof(v[sk]) == "number") {
                        if (!result[k][sk]) result[k][sk] = 0;
                        result[k][sk] += v[sk]
                    }
                }
            }
        }
    }
    console.log(result)
    return result;
}

class DecklyComponent extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            items: [],
            accessor: this.props.colorBy,
            isLoaded: false,
            per: false,
            hoverInfo: {}
        }
        this.handleInputChange = this.handleInputChange.bind(this);
    }
    componentDidMount() {
        document.title = this.props.title;
        fetch(this.props.data)
            .then(results => results.json())
            .then(json => {
                console.log(json);
                if (json.type == "Topology") {
                    json = feature(json, Object.keys(json.objects)[0])
                    console.log(json);
                }
                this.setState({
                    isLoaded: true,
                    items: json.features,
                    aggregate: aggregate(json.features.map(f => f.properties))
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
        const limits = chroma.limits(data, 'e', 2)
        const COLOR_SCALE = chroma.scale('Blues').domain(limits);
        console.log(COLOR_SCALE)
        const layers = [
            new GeoJsonLayer({
                id: 'geojson',
                data: this.state.items,
                opacity: 0.8,
                lineWidthMinPixels: 1,
                getFillColor: f => COLOR_SCALE(this.state.accessor(f)).rgb(),
                getLineColor: [0, 0, 0],
                pickable: true,
                onHover: info => this.setState({hoverInfo: info})
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
                            <DeckGL initialViewState={INITIAL_VIEW_STATE} controller={true} layers={layers}>
                                <StaticMap mapStyle={BASEMAP.DARK_MATTER} />
                                {
                                    this.state.hoverInfo.object && (
                                        <div className="tooltip" style={{position: 'absolute', zIndex: 1, pointerEvents: 'none', left: this.state.hoverInfo.x, top: this.state.hoverInfo.y}}>
                                        { this.props.hoverMessage(this.state.hoverInfo.object) + ": " + this.props.colorBy(this.state.hoverInfo.object).toLocaleString() }
                                        </div>
                                    )
                                }
                                <AbsoluteLegend title={this.props.legendTitle} colorScale={COLOR_SCALE} limits={limits} steps={5}/>
                            </DeckGL>
                        </ReflexElement>
                        <ReflexSplitter/>
                        <ReflexElement className="plots">
                            <div id="controls">
                                <input name="per" type="checkbox" checked={this.state.per} onChange={this.handleInputChange} />
                                <label htmlFor="per">{this.props.perText}</label>
                            </div>
                            {
                                this.props.plots.map(p => {
                                    return <Plot
                                        key={p.id}
                                        data={p.data(this.state.hoverInfo.object ? this.state.hoverInfo.object.properties : this.state.aggregate)}
                                        layout={{
                                            title: p.layout.title(this.state.hoverInfo.object),
                                            barmode: 'stack',
                                        }}
                                        useResizeHandler={true}
                                        style={p.style}
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
    render(<DecklyComponent {...props} />, props.container || document.querySelector('#demo'));
}
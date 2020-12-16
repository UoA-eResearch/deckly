import React from 'react';
import { render } from "react-dom";
import { DeckGL } from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { StaticMap } from 'react-map-gl';
import { BASEMAP } from '@deck.gl/carto';
import chroma from "chroma-js";
import Plot from 'react-plotly.js';
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
        for (var k in item.properties) {
            var v = item.properties[k]
            if (typeof (v) == "object") {
                if (!result[k]) result[k] = {}
                for (var sk in v) {
                    if (typeof (v[sk]) != "number") continue;
                    if (!result[k][sk]) result[k][sk] = 0;
                    result[k][sk] += v[sk]
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
            isLoaded: false
        }
    }
    componentDidMount() {
        document.title = this.props.title;
        fetch(this.props.data)
            .then(results => results.json())
            .then(json => {
                console.log(json);
                this.setState({
                    isLoaded: true,
                    items: json.features,
                    aggregate: aggregate(json.features)
                })
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
                pickable: true
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
                            </DeckGL>
                        </ReflexElement>
                        <ReflexSplitter/>
                        <ReflexElement className="plots">
                            {
                                this.props.plots.map(p => {
                                    return <Plot
                                        data={p.data(this.state.aggregate)}
                                        layout={p.layout}
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
    render(<DecklyComponent {...props} />, document.getElementById("root"));
}
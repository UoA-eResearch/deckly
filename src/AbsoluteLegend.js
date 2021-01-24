import React from 'react';
import chroma from "chroma-js";

const approxeq = (v1, v2, epsilon = 0.001) => Math.abs(v1 - v2) <= epsilon;

export default class AbsoluteLegend extends React.Component {
    render() {
        const labels = []
        const items = []
        if (typeof(this.props.colorScale) == "function") {
            const step = (this.props.limits[1] - this.props.limits[0]) / this.props.steps;
            for (var i = this.props.limits[0]; i <= this.props.limits[1]; i += step) {
                var iStr = i.toLocaleString();
                if (approxeq(i, this.props.limits[0])) {
                    iStr = "<=" + iStr;
                } else if (approxeq(i, this.props.limits[1])) {
                    iStr = ">=" + iStr;
                }
                items.push(<div key={i}><i style={{
                    background: this.props.colorScale(i),
                    width: "18px",
                    height: "18px"
                }}></i>{iStr}</div>)
            }
        } else if (typeof(this.props.colorScale == "object")) {// Bivariate
            const dx = (this.props.limits[0][1] - this.props.limits[0][0]) / this.props.steps;
            const dy = (this.props.limits[1][1] - this.props.limits[1][0]) / this.props.steps;
            labels.push(<div>{this.props.labels[0]}</div>)
            labels.push(<div style={{
                transform: "rotate(90deg) translate(160px, 30px)"
            }}>{this.props.labels[1]}</div>)
            for (var iy = 0; iy < this.props.steps; iy++) {
                for (var ix = 0; ix < this.props.steps; ix++) {
                    var x = this.props.limits[0][0] + ix * dx;
                    var y = this.props.limits[1][0] + iy * dy;
                    items.push(<i style={{
                        background: chroma.blend(this.props.colorScale[0](x), this.props.colorScale[1](y), "multiply"),
                    }} title={`${x.toLocaleString()},${y.toLocaleString()}`}></i>)
                }
            }
        }

        return <div key="legend" className="legend" style={{
            right: this.props.right || 30,
            bottom: this.props.bottom || 30,
        }}>
            <h4>{this.props.title}</h4>
            {labels}
            <div id="grid" style={{
                "grid-template-columns": `repeat(${this.props.steps}, 18px)`
            }}>{items}</div>
            Hover over an area to show plots for that area
        </div>
    }
}
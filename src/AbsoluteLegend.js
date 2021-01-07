import React from 'react';

const approxeq = (v1, v2, epsilon = 0.001) => Math.abs(v1 - v2) <= epsilon;

export default class AbsoluteLegend extends React.Component {
    render() {
        const step = (this.props.limits[1] - this.props.limits[0]) / this.props.steps;
        const items = []
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

        return <div key="legend" className="legend" style={{
            right: this.props.right || 30,
            bottom: this.props.bottom || 30,
        }}>
            <h4>{this.props.title}</h4>
            {items}
            Hover over an area to show plots for that area
        </div>
    }
}
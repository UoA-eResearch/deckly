import React from 'react';

export default class AbsoluteLegend extends React.Component {
    render() {
        const step = (this.props.limits[1] - this.props.limits[0]) / this.props.steps;
        const items = []
        for (var i = this.props.limits[0]; i <= this.props.limits[1]; i += step) {
            items.push(<div><i style={{
                background: this.props.colorScale(i),
                width: "18px",
                height: "18px"
            }}></i>{i.toLocaleString()}</div>)
        }

        return <div className="legend" style={{
            right: this.props.right || 30,
            bottom: this.props.bottom || 30,
        }}>
            <h4>{this.props.title}</h4>
            {items}
        </div>
    }
}
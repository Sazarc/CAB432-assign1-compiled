import React, {Component, Fragment} from 'react';
import { Map, TileLayer, Marker, Popup } from 'react-leaflet'

const MyMarkersList = ({ appCallback, markers }) => {
    const items = markers.map((marker) => (
        <Marker key={marker.round}
                onMouseOver={ (e) => {e.target.openPopup()} }
                onMouseOut={ (e) => {e.target.closePopup()} }
                onClick={(e) => {appCallback(e.target.options.round)}}
                round={marker.round}
                position={marker.latlng}>
            <Popup>Round: {marker.round} || The {marker.raceName}</Popup>
        </Marker>
    ));
    return <Fragment>{items}</Fragment>
};

export default class SimpleExample extends Component {
    state = {
        lat: 51.505,
        lng: -0.09,
        zoom: 3,
        pins: []
    };

    componentDidUpdate(prevProps) {
        if(this.props.season !== prevProps.season){
            super.setState({pins: this.props.markers});
        }
    }

    send(id){
        this.props.appCallback(id);
    }


    render() {
        const position = [this.state.lat, this.state.lng];
        return (
            <Map center={position} zoom={this.state.zoom}>
                <TileLayer
                    attribution='&amp;copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <MyMarkersList appCallback={this.send.bind(this)} markers={this.state.pins} />
            </Map>
        )
    }
}
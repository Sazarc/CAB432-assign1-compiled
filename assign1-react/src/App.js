import React, {Component} from 'react';
import './App.css';
import './Countdown.css';
import Leaflet from './Map';
import OptionSelect from './Option-Select';
import Content from "./Content";
import {PulseLoader} from 'react-spinners';

export const apiLink = "http://127.0.0.1:3030";
// export const apiLink = 'http://' + window.location.host + ':3030';

export default class App extends Component{
    state = {
        loading: false,
        season: 0,
        seasonLength: 0,
        roundInfo: [],
        marker: []
    };

    selectChange = (option) => {
        let markers = [];
        let season = 0;
        let seasonLength = 0;
        let roundInfo = [];
        super.setState({loading: true});
        fetch(apiLink + '/?season=' + option, {method: "GET"})
            .then(function (response) {
                if(response.ok){
                    return response.json();
                }
            })
            .then((result) => {
                let data = result;
                season = data.season;
                seasonLength = data.length;
                roundInfo = data.results;
                markers = data.results.map((marker) => {
                    return marker.marker;
                });
                super.setState({
                    loading: false,
                    marker: markers,
                    season: season,
                    seasonLength: seasonLength,
                    roundInfo: roundInfo
                });
            })
            .catch((error) => {
                console.log(error)
            });
    };

    functionRun(round){
        this.setState({round: this.state.roundInfo[round-1]});
    }

    render(){

        return(
            <div id={"App"}>
                <div className={"UI"}>
                    <div id="select">
                        <img width={200} src={"https://s3.amazonaws.com/gt7sp-prod/decal/68/07/12/4899991239217120768_1.png"} alt={'f1-logo'}/>
                        <h2>Select season:</h2>
                        <OptionSelect selectChanged={this.selectChange}/>
                        <div style={{position: 'absolute'}}>
                            <PulseLoader loading={this.state.loading} css={{marginTop: 50, marginLeft: 120}} color={'white'} />
                        </div>
                    </div>
                    <div id={"content"}>
                        <Content season={this.state.season} round={this.state.round}/>
                    </div>
                </div>
                <div id={"map"}>
                    <Leaflet appCallback={this.functionRun.bind(this)} season={this.state.season} markers={this.state.marker}/>
                </div>
            </div>
        )
    }
}

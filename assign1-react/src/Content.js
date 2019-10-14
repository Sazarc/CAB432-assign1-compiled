import React, {Component} from 'react';
import Countdown from "react-countdown-now";
import ReactTable from "react-table";
import 'react-table/react-table.css';
import ReactHover from 'react-hover'

export default class Content extends Component{
    state = {
        season: 0,
        round: {}
    };
    props = {
        round: null
    };

    componentDidUpdate = (prevProps) => {
        if(this.props.round !== prevProps.round){
            super.setState({season: this.props.season});
            super.setState({round: this.props.round});
        }

    };

    renderer = ({ days, hours, minutes, seconds }) => {
        return(
            <div>
                <h1>{this.state.season} {this.state.round.raceName} in {this.state.round.locality}, {this.state.round.country}:</h1>
                <div id={"countdown"}>
                    <div id={"tiles"}>
                        <span>{days}</span><span>{hours}</span><span>{minutes}</span><span>{seconds}</span>
                    </div>
                    <div className="labels">
                        <li>Days</li>
                        <li>Hours</li>
                        <li>Mins</li>
                        <li>Secs</li>
                    </div>
                </div>
            </div>
        );
    };

    render() {
        if(this.state.round.complete){
            return (
                <div style={{padding: 20}}>
                    <h1>{this.state.season} {this.state.round.raceName} in {this.state.round.locality}, {this.state.round.country}:</h1>
                    <ReactTable
                        style={{color: 'white'}}
                        data={this.state.round["results"]}
                        columns={[
                            {
                                Header: 'Results',
                                columns: [
                                    {
                                        Header: "Position",
                                        accessor: "position"
                                    }
                                ]
                            },
                            {
                                Header: "Driver",
                                columns: [
                                    {
                                        Header: "First Name",
                                        accessor: "givenName"
                                    },
                                    {
                                        Header: "Last Name",
                                        accessor: "familyName"
                                    },
                                    {
                                        Header: "Nationality",
                                        Cell: (row) => {
                                            const optionsCursorTrueWithMargin = {
                                                followCursor: true,
                                                shiftX: -300,
                                                shiftY: -200,
                                            };
                                            return(
                                                <ReactHover
                                                    options={optionsCursorTrueWithMargin}>
                                                    <ReactHover.Trigger type='trigger'>
                                                        <img className={'flagHover'} height={34} src={row.original.flag} alt={row.original.nationality}/>
                                                    </ReactHover.Trigger>
                                                    <ReactHover.Hover type='hover'>
                                                        <div className={'hoverText'}>
                                                            <h1>{row.original.nationality}</h1>
                                                        </div>
                                                    </ReactHover.Hover>
                                                </ReactHover>
                                            )
                                        }
                                    },
                                    {
                                        Header: "Driver number",
                                        accessor: "number"
                                    }
                                ]
                            }
                        ]}
                        defaultPageSize={10}
                        className="-striped -highlight"
                    />
                </div>
            )
        }
        else if(this.state.round.complete === false){
            return (
                <Countdown date={new Date(this.state.round.dateTime)} renderer={this.renderer} />
            )
        }
        else{
            return( <div /> );
        }
    }
}
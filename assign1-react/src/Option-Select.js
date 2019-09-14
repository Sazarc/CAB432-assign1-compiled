import React, {Component} from 'react';
import Select from 'react-select';
import {apiLink} from "./App";

export default class OptionSelect extends Component{
    state = {selectedOption: null,
    options: undefined};
    props = {selectChanged: null};

    constructor(props){
        super(props);
        if(this.state.options === undefined){
            fetch( apiLink + '/seasons', {method: "GET"})
                .then((response) => {
                    if(response.ok){
                        return response.json();
                    }
                })
                .then((result) => {
                    let options = [];
                    for(let x = 0; x < result.seasons.length; x++){
                        options.push({value: result.seasons[x], label: result.seasons[x].toString()})
                    }
                    return options;
                })
                .then((options) => {
                    this.setState({options: options})
                })
                .catch((error) => {
                    console.log(error)
                });
        }
    }

    userChange = (selectedOption) => {
        super.setState({ selectedOption: selectedOption.value });
        this.props.selectChanged(selectedOption.value);
    };

    render(){
        const customStyles = (height = 40) => {
            return {
                menuList: (base) =>({
                    ...base,
                    paddingTop: 0,
                    height: 150,
                }),
            }
        };

        return (
            <Select styles={customStyles()} options={this.state.options} onChange={this.userChange}/>
        );
    }
}
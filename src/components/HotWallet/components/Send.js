import React, {Component, useState} from "react";

import {Button, Icon, Form, Header, Divider, Label} from 'semantic-ui-react';

import { QrReader } from 'react-qr-reader';

class Send extends Component{
    constructor(props){
        super();
        this.props = props;
        this.state = {asset: null, recipient: null, recipientPlaceholder: "0xCA7...Cd63", amount: null, error: "",
                      qrScanner: "" , changeRecipientElem: <video id="videoElem"></video>, scanQr: false}
    }

    componentDidMount = () =>{
        this.setState({asset: "Matic",
            recipientInput:
                    <input id="recipientInput" placeholder={this.state.recipientPlaceholder} onChange={this.changeRecipient}/>

        })
        this.wallet = this.props.wallet;
    }

    changeRecipient = async(event) =>{
        console.log(event.target.value)
        this.setState({recipient: event.target.value});
    }

    changeAmount = async (event) =>{
        console.log(event.target.value);
        this.setState({amount: event.target.value})
    }

    setAmount = () =>{
        this.setState({amount: this.props.balance})
    }

    send = async () =>{
        this.setState({error:""})
        if(!this.props.utils.isAddress(this.state.recipient)){
            this.setState({error: "Invaild recipient address given. Cannot send transaction."})
            return;
        }

        if(!Number(this.state.amount) || !(Number(this.state.amount) < Number(this.props.balance))){
            //console.log(this.state.amount)
            this.setState({error: "Invalid amount entered."})
            return
        }

        this.setState({sending:true})

        var receipt = this.wallet.send(this.state.recipient, this.state.amount)

        console.log(receipt)

        this.setState({sending:false})

        this.props.retrieveInfo(this.props.account);
    }

    scanQr = () =>{
        this.setState({scanQr : true});
    }

    render(){
        var sendButton = this.state.sending ? <Button secondary loading>Send</Button>: <Button secondary onClick={this.send}>Send</Button>

        const QrScanner = (props) => {
            const [data, setData] = useState('No result');
          
            return (
              <>
                <QrReader
                  constraints = {{ "facingMode": 'environment' }}
                  onResult={(result, error) => {    
                    if (!!result) {

                        var result = result?.text;
                        console.log(result)
                        if(!this.props.utils.isAddress(result)){
                            return;
                        }
                        this.setState({recipientInput: <input id="recipientInput" placeholder={this.state.recipientPlaceholder} value={result} onChange={this.changeRecipient}/>,
                                       scanQr:false, recipient: result})
                    }
          
                    if (!!error) {
                      console.info(error);
                    }
                  }}
                  style={{ width: '100%' }}
                />
                {/*<p>{data}</p>*/}
              </>
            );
          };
        
        return(
            <div id = "send">
                <div id='leftAlign'>
                    <div id="compHeader"> <button id="back" onClick ={this.props.back}><Icon size="large" name = "arrow left"/></button> <Header color="blue">Send {this.state.asset}</Header> </div>
                    <Divider/>
                    {this.state.scanQr ? <QrScanner /> : <div />}
                    <Form inverted>
                        <Form.Input label="Recipient:">
                            {this.state.recipientInput}
                            <Label id = "assetLabel"><button id="qrButton" onClick={this.scanQr}><Icon name="qrcode" size="large"/></button></Label>  
                        </Form.Input>
                        <Form.Input defaultValue={this.state.amount} onChange={this.changeAmount} label={<div className ="amountLabel">Amount: <button id="sendBalance" onClick={this.setAmount}><Icon name="balance"/>{this.props.balance}</button></div>} placeholder="0.000000">    
                            <input />
                            <Label id = "assetLabel">{this.state.asset}</Label>
                        </Form.Input>
                        <div>{this.state.error}</div><br/>
                        {sendButton}
                    </Form>
                </div>
            </div>
        );
    }
}

export default Send;
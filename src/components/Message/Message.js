import React from 'react';

import './Message.css'

function Message({message}){
    
    return <div className="messageCard">

                    <h3 className='message'>{message}</h3>

            </div>;
}

export default Message;
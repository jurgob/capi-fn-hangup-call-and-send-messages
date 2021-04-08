/**
nexmo context: 
you can find this as the second parameter of rtcEvent funciton or as part or the request in req.nexmo in every request received by the handler 
you specify in the route function.

it contains the following: 
const {
        generateBEToken,
        generateUserToken,
        logger,
        csClient,
        storageClient
} = nexmo;

- generateBEToken, generateUserToken,// those methods can generate a valid token for application
- csClient: this is just a wrapper on https://github.com/axios/axios who is already authenticated as a nexmo application and 
    is gonna already log any request/response you do on conversation api. 
    Here is the api spec: https://jurgob.github.io/conversation-service-docs/#/openapiuiv3
- logger: this is an integrated logger, basically a bunyan instance
- storageClient: this is a simple key/value inmemory-storage client based on redis

*/



/** 
 * 
 * This function is meant to handle all the asyncronus event you are gonna receive from conversation api 
 * 
 * it has 2 parameters, event and nexmo context
 * @param {object} event - this is a conversation api event. Find the list of the event here: https://jurgob.github.io/conversation-service-docs/#/customv3
 * @param {object} nexmo - see the context section above
 * */

const DATACENTER = `https://api.nexmo.com` 

const rtcEvent = async (event, { logger, csClient,config }) => {

    try { 
        const type = event.type 
        if (type === 'app:knocking') { /* I m receiving a knocker, it means someone is trying to enstiblish a call  */
            const knocking_id = event.from
            const { channel } = event.body
            const leg_id = channel.id
            
            //hangup the call
            await csClient({
                url: `${DATACENTER}/v0.3/legs/${leg_id}`,
                method: "put",
                data: {
                    "action": "hangup"
                }
            })
            //if I m called by a phone, send a notify sms to the caller
            if (channel.from.type === "phone"){
                
                await csClient({
                    url: `${DATACENTER}/v0.1/messages`,
                    method: "post",
                    data: {
                        "to": {
                            "type": "sms",
                            "number": `${channel.from.number}`
                        },
                        "from": {
                            "type": "sms",
                            "number": `${ channel.to.number }`//the caller wil receive the sms from the same number he is calling
                        },
                        "message": {
                            "content": {
                                "type": "text",
                                "text": "Sorry your call was hangup becouse we are very busy!"
                            }
                        }
                    }
                })

            }
            
        }

    } catch (err) {
        
        logger.error("Error on rtcEvent function")
    }
    
}





module.exports = {
    rtcEvent
}
import fetch from "node-fetch";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const api_key = process.env.WHATSAPP_API_KEY;

async function sendTemplateMessageFromWhatsapp(number, api_key, templateName) {
    try {
        const response = await fetch(
            "https://graph.facebook.com/v19.0/346102558576964/messages",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${api_key}`,
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: number,
                    type: "template",
                    template: {
                        name: templateName,
                        language: {
                            code: "en_GB",
                        },
                    },
                }),
            }
        );

        const jsonResponse = await response.json();
        const messageId = jsonResponse.messages;
        console.log(`Message ID: ${messageId}.\nResponse: ${jsonResponse}`);

        return messageId;
    } catch (error) {
        console.error("Error sending template message:", error);
        return null;
    }
}

async function sendTextMessageFromWhatsapp(number, api_key, message) {
    try {
        const truncatedMessage = message.substring(0, 4096);

        const response = await fetch(
            "https://graph.facebook.com/v19.0/346102558576964/messages",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${api_key}`,
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: number,
                    type: "text",
                    text: {
                        body: truncatedMessage,
                    },
                    action: {
                        name: "send_location",
                    },
                }),
            }
        );

        const jsonResponse = await response.json();
        console.log(`Response: ${JSON.stringify(jsonResponse)}`);

    } catch (error) {
        console.error("Error sending text message:", error);
        return null;
    }
}

async function sendInteractiveLocationRequest(number, api_key, message) {
    try {
        const response = await fetch(
            "https://graph.facebook.com/v19.0/346102558576964/messages",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${api_key}`,
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: number,
                    type: "interactive",
                    interactive: {
                        type: "location_request_message",
                        body: {
                            text: message,
                        },
                        action: {
                            name: "send_location",
                        },
                    },
                }),
            }
        );
        console.log(response);
        const jsonResponse = await response.json();
        console.log(`Response: ${jsonResponse}`);
    } catch (error) {
        console.error("Error sending interactive location request:", error);
    }
}

async function sendLocationDataMessage(
    number,
    api_key,
    latitude,
    longitude,
    locationName,
    address
) {
    try {
        const response = await fetch(
            "https://graph.facebook.com/v19.0/346102558576964/messages",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${api_key}`,
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: number,
                    type: "location",
                    location: {
                        latitude: latitude,
                        longitude: longitude,
                        name: locationName,
                        address: address,
                    },
                }),
            }
        );
        const jsonResponse = await response.json();
        const messageId = jsonResponse.messages.id;
        console.log(`Message ID: ${messageId}.\nResponse: ${jsonResponse}`);

        return messageId;
    } catch (error) {
        console.error("Error sending location data message:", error);
        return null;
    }
}

async function getChatCompletion() {
    const openai = new OpenAI();

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { "role": "system", "content": `"Create a search query to pass into a google Api to help find a list of recommended activities based on user preference and location for example: Hamburger Restaurant in Acton,London"` },
                { "role": "user", "content": "lebanese food london" },
            ],
            model: "gpt-3.5-turbo",
        });
        
        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

async function cleanResponse(response) {
    const openai = new OpenAI();

    try {
        const cleanedResponse = await openai.chat.completions.create({
            messages: [
                { "role": "system", "content": "Receiving the response: [...], organize the information removing unnecessary symbols and tags, for example: Zeit & Zaatar, http://zeitzaatar.com, 215 Uxbridge Rd, London W13 9AA, UK, nationalPhoneNumber:020 8840 5040, UK, rating:4.5, userRatingCount:149,price level, Lebanese Restaurant" },
                { "role": "user", "content": JSON.stringify(response) }
            ],
            model: "gpt-3.5-turbo",
        });

        return cleanedResponse.choices[0].message.content;
        
    } catch (error) {
        console.error('Error cleaning response:', error);
        return "Error cleaning response";
    }
}

async function msgOutput(responder) {
    const openai = new OpenAI();

    try {
        const messageSender = await openai.chat.completions.create({
            messages: [
                { "role": "system", "content": "You are a playful Ai chatbot, designed to recommend spontaneous fun activities to a user, write a playful whatsapp text that suggests one activity based on the data provided, for example Hey why dont you try out Zeit & Zaatar, its not too far from your location! This has good reviews and matches your cravings! Here is some information about the flavourful adventure awaiting you! http://zeitzaatar.com, 215 Uxbridge Rd, London W13 9AA, UK, nationalPhoneNumber:020 8840 5040, UK, rating:4.5, userRatingCount:149,price level, Lebanese Restaurant" },
                { "role": "user", "content": JSON.stringify(responder) }
            ],
            model: "gpt-3.5-turbo",
        });
        
        return messageSender.choices[0].message.content;
        
    } catch (error) {
        console.error('Error cleaning response:', error);
        return "Error cleaning response";
    }
}

async function googleApi() {
    const userMessage = await getChatCompletion();
    console.log(userMessage);
  
    if (userMessage) {
      const url = 'https://places.googleapis.com/v1/places:searchText';
      const googleApiKey = process.env.googleApiKey;
      const data = {
        textQuery: userMessage,
        languageCode: "en-GB",
        rankPreference: "DISTANCE",
        maxResultCount: 10,
        locationBias: {
          circle: {
            center: {
              latitude: 37.7937,
              longitude: -122.3965
            },
            radius: 5000.0
          }
        }
      };
  
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': googleApiKey,
            'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.priceLevel,places.primaryType,places.editorialSummary,places.rating,places.websiteUri,places.nationalPhoneNumber,places.userRatingCount'
          },
          body: JSON.stringify(data)
        });
  
        const responseData = await response.json();

        const cleanedResponse = await cleanResponse(responseData);
        const theOutput = await msgOutput(cleanedResponse)
    
        await sendTextMessageFromWhatsapp('+123456789', api_key, theOutput);
      } catch (error) {
        console.error('Error:', error);
      }
    }
  }
  
  googleApi();

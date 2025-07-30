import axios from 'axios';
const SYNC_PAY_BASE_URL = 'https://api.syncpay.pro/v1/gateway/api/';
const RAW_API_KEY = process.env.SYNC_PAY_API_KEY;
const SYNC_PAY_API_KEY = Buffer.from(RAW_API_KEY).toString('base64');
export const initiatePixDeposit = async ({ amount, userData }) => {
    console.log(userData,amount);

    try {
        const response = await axios.post(`${SYNC_PAY_BASE_URL}`, {
            amount,
            currency: 'BRL',
            payment_method: 'pix',
            callback_url:"https://seuservidor.com/webhook.php",
            customer: {
                name: userData.firstName,
                email: userData.email,
                cpf:userData.cpf
            },
            postbackUrl:"https://seuservidor.com/webhook.php"
        }, {
            headers: {
                Authorization: `Basic ${SYNC_PAY_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });
// console.log(response.data)
        return response.data;
    } catch (error) {
        console.error('SyncPay deposit error:', error.response?.data || error.message);
        throw new Error('Failed to initiate SyncPay deposit');
    }
};


export const initiatePixWithdrawal = async ({ amount, user }) => {
    try {
        console.log(user);
        
      const response = await axios.post(`https://api.syncpay.pro/c1/cashout/api/`, {
        amount,
        currency: 'BRL',
        payment_method: 'pix',
        callback_url: "https://suaplataforma/webhook",
        customer: {
          name: user.firstName,
          email: user.email,
          cpf: user.cpf,
          pixKey: user.pixKey, // This should exist in your DB
          pixKeyType: 'cpf'    // or 'email' / 'phone' / 'random'
        },
        postbackUrl: "https://suaplataforma/webhook"
      }, {
        headers: {
          Authorization: `Basic ${SYNC_PAY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
  
      return response.data;
    } catch (error) {
      console.error('SyncPay withdrawal error:', error.response?.data || error.message);
      throw new Error('Failed to initiate SyncPay withdrawal');
    }
  };
  
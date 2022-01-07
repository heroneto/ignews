import { NextApiRequest, NextApiResponse } from "next";
import { query as q } from 'faunadb'
import { getSession } from "next-auth/react";
import { fauna } from "../../services/fauna";
import { stripe } from "../../services/stripe";

type User = { 
  ref: {
    id: string
  },
  data: {
    stripe_customer_id: string
  }
}

export default async (req : NextApiRequest, res: NextApiResponse) => {
  if(req.method === 'POST') {

    //Coleta session dos cookies
    const session = await getSession({ req })

    //Busca usuário que está tentando fazer checkout
    const user = await fauna.query<User>(
      q.Get(
        q.Match(
          q.Index('user_by_email'),
          q.Casefold(session.user.email)
        )
      )
    )

    let customerId  = user.data.stripe_customer_id

    if(!customerId){
  	  // Caso não exista no stripe, cria um usuário lá e add o id dele no fauna
      const stripeCustomer = await stripe.customers.create({
        email: session.user.email
      })  

      await fauna.query(
        q.Update(
          q.Ref(q.Collection('users'), user.ref.id),
          {
            data: {
              stripe_customer_id: stripeCustomer.id
            }
          }
        )
      )

      customerId  = stripeCustomer.id
  
    }


    const stripeCheckoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      line_items: [
        { price: 'price_1JfCkGLQOmbrBqWpMURtge9v', quantity: 1 }        
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: process.env.STRIPE_SUCCESS_URL,
      cancel_url: process.env.STRIPE_CANCEL_URL,
    })

    return res.status(200).json({
      sessionId: stripeCheckoutSession.id
    })

  }else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method not allowed')
  }
}
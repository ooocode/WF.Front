
import React, { createRef, useEffect } from 'react';
import { useQueryStringParser } from '../hooks/useQueryStringParser';
import Index from './ArchPages/Index';
import { navigate, withPrefix } from 'gatsby';
import { redirect_uri } from '../hooks/useApi';
import { enableSSO, StringUtils, workFlowBaseUrl } from '../Commmon/consts';

import { Helmet } from "react-helmet";
//import ReactDOM from 'react-dom';
//import * as serviceWorker from './serviceWorker';


export default function Home() {
  const query = useQueryStringParser()
  const userName = query.get('userName')
  const password = query.get('password')

  useEffect(() => {
    if (!StringUtils.isNullOrEmpty(userName) && !StringUtils.isNullOrEmpty(password)) {
      navigate(`/AccountPages/Login?userName=${userName}&password=${password}`)
    } else {
      if (enableSSO) {
        const href = `${workFlowBaseUrl}/connect/authorize?client_id=client1&scope=openid email api1&response_type=token&redirect_uri=${redirect_uri}&state=abc&nonce=xyz`
        window.location.href = href
      } else {
        navigate('/AccountPages/Login')
      }
    }
  }, [userName, password])



  const sRef = createRef<any>()


  return <div>
 

    {/* <Index /> */}
  </div>
}
/*ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);*/


/*Axios.get('http://localhost:58890').then(res => {
  console.log('WPS初始化成功')
}).catch(err => window.open('ksoWPSCloudSvr://start=RelayHttpServer'))*/
/*
ReactDOM.render(
  <App />,
  document.getElementById('root')
); */

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
//serviceWorker.unregister();

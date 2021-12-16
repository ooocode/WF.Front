import { Button } from 'antd'
import React from 'react'
import { enableSSO, workFlowBaseUrl } from '../../Commmon/consts'
import { redirect_uri } from '../../hooks/useApi'

export default () => {
    const login = () => {
        if (enableSSO) {
            const href = `${workFlowBaseUrl}/connect/authorize?client_id=client1&scope=openid email api1&response_type=token&redirect_uri=${redirect_uri}&state=abc&nonce=xyz`
            window.location.href = href
        }
    }
    return <div>
        账号已注销，<Button onClick={login}>重新登录？</Button>
    </div>
}
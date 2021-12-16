import { navigate, withPrefix } from 'gatsby-link'
import React, { useEffect, useState } from 'react'
import { useAsync } from 'react-use'
import { isSSR, StringUtils, workFlowBaseUrl } from '../../Commmon/consts'
import { useUser } from '../../hooks/useApi'
import { useQueryStringParser } from '../../hooks/useQueryStringParser'
import { useStateEx } from '../../hooks/useToggle'
import { UserInfoClient } from '../../WorkFlowApi'

export default () => {
    const errors = useStateEx('')
    const query = useQueryStringParser()
    const access_token = query.get('access_token')
    const { setLoginInfo } = useUser()

    useAsync(async () => {
        /* userManager.signinCallback().then(res => {
             console.log('user',res)
             navigate('/')
         }).catch(err => {
             errors.setValue(JSON.stringify(err))
             console.log('error',err)
         })*/
        if (!StringUtils.isNullOrEmpty(access_token)) {
            const userInfoClient = new UserInfoClient(workFlowBaseUrl, {
                fetch: (input: RequestInfo, init?: RequestInit | undefined) => {
                    var header = init?.headers as HeadersInit as Record<string, string>
                    header['Authorization'] = `Bearer ${access_token}`
                    return fetch(input, init)
                }
            })
            const claims = await userInfoClient.getUserInfo()
            await setLoginInfo({
                access_token: access_token ?? '',
                userName: claims['preferred_username'],
                userDisplayName: claims['nickname'],
                password: '',
                mainDepartment: claims['main_department'],
                phoneNumber: claims['phone_number']
            })

            if (!isSSR) {
                window.location.href = withPrefix('/ArchPages/Index/')
            } else {
                navigate('/ArchPages/Index/')
            }
        }
    }, [access_token])

    return <div>
        {errors.value.length > 0 ? <p>{errors.value}</p> : <></>}
        正在转跳到首页,请稍等.....
    </div>
}
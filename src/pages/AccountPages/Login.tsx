import { useEffect, useState } from 'react'
import { usersClient, useUser } from '../../hooks/useApi'
import { useQueryStringParser } from '../../hooks/useQueryStringParser';
import { navigate, withPrefix } from 'gatsby';
import { isDevelopment, isSSR, StringUtils, workFlowBaseUrl } from '../../Commmon/consts';
import React from 'react';
import { GrantType, TokenClient, TokenErrorResponse, UserInfoClient } from '../../WorkFlowApi';
import "antd/dist/antd.css";
import { Button, Checkbox, Form, Input, message, Modal, notification, Space, Spin } from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { notificationError } from '../../messageBox';
import { useAsync, useLocalStorage, useTitle } from 'react-use';
import localforage from 'localforage';

interface ILoginProps {
    userName: string
    password: string
}

export default () => {
    const query = useQueryStringParser()
    useTitle('登录OA')
    const { setLoginInfo } = useUser()
    const [rememberPassword, setRememberPassword] = useLocalStorage('rememberPassword', false)


    const { control, reset, handleSubmit } = useForm<ILoginProps>({
        defaultValues: {
            userName: query.get('userName') ?? '',
            password: query.get('password') ?? ''
        }
    })

    useAsync(async () => {
        var v = await localforage.getItem<ILoginProps>('rememberUser')
        if (v) {
            reset(v)
        }
    }, [])

    const [isProcessing, setIsProcessing] = useState(false)

    const onSubmit = handleSubmit(async value => {
        if (isProcessing) {
            return
        }

        setIsProcessing(true)
        console.log('开始登录')
        try {
            const client = new TokenClient(workFlowBaseUrl)
            const res = await client.getToken(GrantType._1, 'oa-pc', value.userName, value.password, '')

            const userInfoClient = new UserInfoClient(workFlowBaseUrl, {
                fetch: (input: RequestInfo, init?: RequestInit | undefined) => {
                    var header = init?.headers as HeadersInit as Record<string, string>
                    header['Authorization'] = `Bearer ${res.access_token}`
                    return fetch(input, init)
                }
            })
            const claims = await userInfoClient.getUserInfo()
            await setLoginInfo({
                access_token: res.access_token ?? '',
                userName: claims['preferred_username'],
                userDisplayName: claims['nickname'],
                password: value.password,
                mainDepartment: claims['main_department'],
                phoneNumber: claims['phone_number']
            })

            if (rememberPassword) {
                await localforage.setItem('rememberUser', value)
            } else {
                await localforage.removeItem('rememberUser')
            }

            console.log('登录成功')

            if (value.userName.toLocaleLowerCase() === 'wenys') {
                window.location.href = `http://${value.userName.toLocaleLowerCase()}:${value.password}@172.26.130.105/V3/Default.aspx`
            } else {
                window.location.href = withPrefix('/ArchPages/Index/')
            }
        } catch (error) {
            if (error instanceof TokenErrorResponse) {
                if (error.error === 'password is invalid') {
                    message.error('密码错误', 5)
                } else if (error.error === 'user not exist') {
                    message.error('账号不存在', 5)
                } else {
                    message.error('登录失败：' + error.error, 5)
                }

            } else if (error instanceof Error) {
                message.error(error.message)
            } else {
                message.error('未知的错误')
            }

            console.log('登录失败', error)
        }
        setIsProcessing(false)
    })


    //自动登录
    /*useEffect(() => {
        if (isDevelopment) {
            return
        }

        if (!StringUtils.isNullOrEmpty(userName) && !StringUtils.isNullOrEmpty(password)) {
            login()
        } else {
            //userManager.signinRedirect()
        }
    }, [userName, password])*/

    const onCancel = () => {
        reset({
            userName: '',
            password: ''
        })
    }

    return <div>
        <div>
            <Modal title={<>
                {isSSR === false ? window.location.origin : ''}<br />
                此网站要求您登录。
            </>}
                visible={true}
                closeIcon={<></>}
                cancelText="取消"
                transitionName=''
                maskTransitionName=''
                style={{ top: 20 }}
                okText="登录"
                footer={null}
                maskStyle={{ backgroundColor: 'white' }}
                maskClosable={false}
                onCancel={onCancel}>
                <Form>
                    <Form.Item label="账号">
                        <Controller control={control}
                            name='userName'
                            rules={{ required: true }}
                            render={({ field }) => <Input {...field} autoFocus disabled={isProcessing} />} />
                    </Form.Item>

                    <Form.Item label="密码">
                        <Controller control={control}
                            name='password'
                            rules={{ required: true }}
                            render={({ field }) => <Input.Password {...field} disabled={isProcessing} />} />
                    </Form.Item>


                    <Form.Item>
                        <Checkbox checked={rememberPassword}
                            onChange={e => setRememberPassword(e.target.checked)}>记住密码</Checkbox>
                    </Form.Item>

                    <Form.Item>
                        <div style={{ textAlign: "right" }}>
                            <Button type='primary' htmlType='submit' style={{ marginRight: 10 }}
                                onClick={onSubmit} disabled={isProcessing}>登录</Button>
                            <Button onClick={onCancel} disabled={isProcessing}>取消</Button>
                        </div>
                    </Form.Item>
                </Form>
                {isProcessing && <Spin tip="正在登录......" />}
            </Modal>
        </div>
    </div>
}
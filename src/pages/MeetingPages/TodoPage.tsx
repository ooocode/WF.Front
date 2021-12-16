
import { Breadcrumb, Button, Form, Input, notification, Space, Spin, Table } from 'antd'
import Search from 'antd/lib/input/Search'
import { ColumnsType } from 'antd/lib/table'
import produce from 'immer'
import React, { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useAsync } from 'react-use'
import MainLayout from '../../components/MainLayout'
import MainLayout1 from '../../components/MainLayout'
import MyDialog from '../../components/MyDialog'
import { dataStorageClient, keyValueStorageClient, useUser } from '../../hooks/useApi'
import { useFormQueryString } from '../../hooks/useFormQueryString'
import { IuseToggleResult, useToggle } from '../../hooks/useToggle'




export default () => {
    return <MainLayout>
        <Breadcrumb>
            <Breadcrumb.Item>首页</Breadcrumb.Item>
            <Breadcrumb.Item>会议管理</Breadcrumb.Item>
        </Breadcrumb>
        <hr />
        <Space>
            {/*  <Button onClick={dlg.Toggle}>登记入库</Button>
            <Button onClick={statDlgVisual.Toggle}>统计分析</Button> */}
        </Space>
        <ChildrenCom />
        <hr />
    </MainLayout>
}


const ChildrenCom = () => {

    const { userName, mainDepartment } = useUser()
    const { mode, prodefKey } = useFormQueryString()
    
    useEffect(() => {
        console.log(555)
    }, [])
    return <div>

    </div>
}

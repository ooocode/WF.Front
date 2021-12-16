import { Button, Checkbox, Form, Input, Space } from 'antd';
import { CheckboxValueType } from 'antd/lib/checkbox/Group';
import TextArea from 'antd/lib/input/TextArea';
import React, { useEffect, useRef, useState } from 'react';
import { InputGroup } from '../../components/InputGroup';
import { processDefsClient, opinionTypesClient } from '../../hooks/useApi';
import { useQueryStringParser } from '../../hooks/useQueryStringParser';
import { messageBox } from '../../messageBox';
import { IOpinionTypeViewModel, ProcessDefViewModel, OpinionTypeViewModel } from '../../WorkFlowApi';
import { useLocation } from '@reach/router'
import MainLayout from '../../components/MainLayout';

const CreateOpinionTypePage = () => {
    const query = useQueryStringParser()
    const prodefKey = query.get('prodefKey')
    let vm = useRef<IOpinionTypeViewModel>({ processDefKey: prodefKey ?? '', name: '', displayName: '' })
    const [prodef, setProdef] = useState<ProcessDefViewModel>()
    const arrOpinionButtons = useRef<string[]>([])

    useEffect(() => {
        processDefsClient.getProcessDefByKey(prodefKey ?? '').then(res => {
            setProdef(res)
            console.log(res)
        }).catch(err => messageBox(err))
    }, [prodefKey])

    /**
     * 点击创建
     */
    const onSaveClicked = () => {
        console.log(vm.current)
        vm.current.arrOpinionButtons = arrOpinionButtons.current
        opinionTypesClient.createOpinionType(OpinionTypeViewModel.fromJS(vm.current)).then(() => {
            messageBox('创建成功')
        }).catch(err => messageBox(err))
    }

    const history = useLocation()

    const onCancelBtnClicked = () => {
        window.history.back()
        //history.()
    }

    function onCheckboxGroupChange(checkedValues: CheckboxValueType[]) {
        vm.current.arrAllowEditOnActvities = checkedValues.map(e => { return e.toString() })
    }

    return <MainLayout>
        <Form labelCol={{ span: 4 }}>
            <Form.Item label='处理定义key' required>
                <Input defaultValue={prodefKey??''} onChange={e => vm.current.processDefKey = e.target.value} />
            </Form.Item>

            <Form.Item label='名称' required>
                <Input onChange={e => vm.current.name = e.target.value} />
            </Form.Item>

            <Form.Item label='显示名称'>
                <Input onChange={e => vm.current.displayName = e.target.value} />
            </Form.Item>

            <Form.Item label='描述'>
                <TextArea onChange={e => vm.current.desc = e.target.value} autoSize />
            </Form.Item>

            <Form.Item label='排序'>
                <Input type='number' onChange={e => vm.current.order = parseInt(e.target.value)} />
            </Form.Item>

            <Form.Item label='默认意见按钮'>
                <InputGroup initValue={[]} onChange={(value) => arrOpinionButtons.current = value} />
            </Form.Item>

            <Form.Item label='允许填意见的活动'>
                <Checkbox.Group options={prodef?.userTaskActvities?.map(e => { return { label: e.value ?? '', value: e.value ?? '' } }) ?? []}
                    defaultValue={[]}
                    onChange={(values: CheckboxValueType[]) => onCheckboxGroupChange(values)} />
            </Form.Item>

            <Form.Item label='操作'>
                <Space size='middle'>
                    <Button onClick={() => onSaveClicked()} type='primary'>创建</Button>
                    <Button onClick={() => onCancelBtnClicked()}>取消</Button>
                </Space>
            </Form.Item>
        </Form>
    </MainLayout>
}

export default CreateOpinionTypePage
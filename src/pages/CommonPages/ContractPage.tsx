
import { Form, Input, Select } from 'antd';
import * as React from 'react';
import MainLayout from '../../components/MainLayout';

const ContractPage = () => {

    const [select, setSelect] = React.useState(1)
    return <MainLayout>
        <div>
            <Form>
                <Form.Item label="字段1">
                    <select value={select} onChange={e => setSelect(parseInt(e.target.value))}>
                        <option>1</option>
                        <option>2</option>
                    </select>
                </Form.Item>

                {select === 1 && <>
                    <Form.Item label="字段2">
                        <Input value="这是字段2"></Input>
                    </Form.Item>

                    <Form.Item label="字段3">
                        <Input value='这是字段3'></Input>
                    </Form.Item>
                </>}


                {select === 2 && <>
                    <Form.Item label="字段3">
                        <Input value='这是字段3'></Input>
                    </Form.Item>

                    <Form.Item label="字段2">
                        <Input value="这是字段2"></Input>
                    </Form.Item>

                </>}
            </Form>
        </div>
    </MainLayout>
}

export default ContractPage
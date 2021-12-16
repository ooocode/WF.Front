import {Modal } from 'antd';
import React, { useState } from 'react'
import Draggable from 'react-draggable';

interface MyDialog {
    children: React.ReactNode;
    open: boolean
    title: string
    onClose: () => void
}


export default function MyDialog(props: MyDialog) {
    const [state, setState] = useState({
        disabled: true,
        bounds: { left: 0, top: 0, bottom: 0, right: 0 },
    })

    const draggleRef = React.createRef<any>();

  /*   const showModal = () => {
        setState({ ...state, visible: true })
    };

    const handleOk = (e: any) => {
        console.log(e);
        setState({ ...state, visible: false })
    };

    const handleCancel = (e: any) => {
        console.log(e);
        setState({ ...state, visible: false })
    }; */

    const onStart = (event: any, uiData: any) => {
        const { clientWidth, clientHeight } = window?.document?.documentElement;
        const targetRect = draggleRef?.current?.getBoundingClientRect();
        setState({
            ...state,
            bounds: {
                left: -(targetRect?.left ?? 0) + uiData?.x,
                right: clientWidth - ((targetRect?.right ?? 0) - uiData?.x),
                top: -(targetRect?.top ?? 0) + uiData?.y,
                bottom: clientHeight - ((targetRect?.bottom ?? 0) - uiData?.y),
            },
        });
    };


    const { bounds, disabled } = state;
    return (
        <>
            <Modal
                maskTransitionName=""
                transitionName=""
                title={
                    <div
                        style={{
                            width: '100%',
                            cursor: 'move',
                        }}
                        onMouseOver={() => {
                            if (disabled) {
                                setState({
                                    ...state,
                                    disabled: false,
                                });
                            }
                        }}
                        onMouseOut={() => {
                            setState({
                                ...state,
                                disabled: true,
                            });
                        }}
                        // fix eslintjsx-a11y/mouse-events-have-key-events
                        // https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/master/docs/rules/mouse-events-have-key-events.md
                        onFocus={() => { }}
                        onBlur={() => { }}
                    // end
                    >
                       {props.title}
                    </div>
                }
                width={900}
                visible={props.open}
                //onOk={handleOk}
                footer={<></>}
                onCancel={props.onClose}
                modalRender={modal => (
                    <Draggable
                        disabled={disabled}
                        bounds={bounds}
                        onStart={(event: any, uiData: any) => onStart(event, uiData)}
                    >
                        <div ref={draggleRef}>
                            {modal}
                        </div>
                    </Draggable>
                )}
            >
                <div>
                    {props.children}
                </div>
            </Modal>
        </>
    );
}
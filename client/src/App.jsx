import { useState, useEffect } from 'react';
import { css } from '@linaria/core';
import { styled } from '@linaria/react';
import { Counter } from './features/counters/counter';
import { useSelector, useDispatch } from 'react-redux'


const App = () => {
    const count = useSelector((state) => state.counter.value);
    const size = 20


    const purple = css`
    background-color: gray;
    width: 20%;
    `
    const Title = styled.h1`
    font-size: ${size}px;
    font-weight: bold;
    color: pink;
    .${purple}{
        width: 30%;
    }`

    const P = styled.p`
    color: purple;
    `

    const LargeTilte = styled(Title)`
        color: purple;
    `

    const title = css`
  font-size: 24px;
  color: black;
  background-color: yellow;
`;

    const Paragraph = styled.p`
  font-size: 16px;
  color: #555;
`;

    const Article = styled.article`
  /* when referring to class names, prepend a dot (.) */
  .${title} {
    font-size: 36px;
  }

  /* when referring to a component, interpolate it as a selector */
  ${Paragraph} {
    font-size: 14px;
    margin: 16px;
  }
`;


    return (
        <div>
            <h1 className={purple}>Hello from React!</h1>
            <Title>waddup</Title>
            <Article className={title}><h2>asdf</h2>yoooo</Article>
            <LargeTilte>shees</LargeTilte>
            <Counter />
            <P>{count}</P>
        </div>
    )
};

export default App;
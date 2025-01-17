import styled from "styled-components";

const PromptContainer = styled.div`
    border: 1px solid ${({ theme }) => theme.elements.prompt.container.border};
    margin-top: 30px;
    width: 240px;
    border-radius: 10px;
    height: 225px;
    background: ${({ theme }) => theme.elements.prompt.container.background};
    box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.15);
    padding: 10px;
`;

export default PromptContainer;

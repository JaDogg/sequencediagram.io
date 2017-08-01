
test('change to state without messages after state with messages', () => {
    goTo('o1,Foo;o2,Bar;m1,o1,o2,baz()');
    goTo('o100,Hello');
    // The code might crash if it doesnt transition atomically to the new
    // app state. For example, if there is an intermediate state where the new
    // object o100 lives along the old message m1, m1 will reference objects
    // not present any longer, which can cause an app crash if not handled
    // carefully
    return assertFragment('o100,Hello');
});

test('hints shown when clicking "Share"', () => {
    goTo('empty');
    click('Add object'); // To make Share button appear
    click('Share');
    return Promise.all([
            waitForElement('Share by PNG'),
            waitForElement('Share by URL'),
            ]);
})

test('hints hide when clicking "Hide share info"', () => {
    goTo('empty');
    click('Add object'); // To make Share button appear
    click('Share');
    click('Hide share info');
    return reversePromise(Promise.all([
            waitForElement('Share by PNG'),
            waitForElement('Share by URL'),
            ]));
}, 20 * 1000)

const tipText = 'Click "Add object" to start';

test('tip shown for default diagram', () => {
    goTo('none');
    sleepIfHumanObserver(2);
    return waitForElement(tipText);
});

test('tip not shown for non-default diagram (one extra object)', () => {
    goTo('o1,Foo;o3,NewObject;o4,NewObject;m1,o1,o3,sendMessage()');
    sleepIfHumanObserver(2);
    return reversePromise(waitForElement(tipText));
});

test('tip not shown for non-default diagram (one extra message)', () => {
    goTo('o1,Foo;o2,Bar;m1,o1,o2,Baz;m2,o1,o2,sendMessage()');
    sleepIfHumanObserver(2);
    return reversePromise(waitForElement(tipText));
});

test('MANUAL: Inspect layout and message appearances', () => {
    const url = goTo('o4,Recieve;o1,Sender%20;o2,Recieve;o3,Self%20sender;o7,Foo;o8,Bar;o5,Loooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong;m17,o7,o8,message%20with%20big%20height.%20message%20with%20big%20height.%20message%20with%20big%20height.%20message%20with%20big%20height.%20message%20with%20big%20height.%20message%20with%20big%20height.%20message%20with%20big%20height.%20;m15,o5,o3,oomph%20oomph%20oomph%20oomph%20oomph%20oomph%20oomph;m1,o1,o4,sync%20left;m9,o1,o4,async%20left%20async%20left%20async%20left%20async%20left,a;m2,o1,o4,sync%20reply%20left.%20sync%20reply%20left.%20sync%20reply%20left.%20sync%20reply%20left.%20sync%20reply%20left.%20sync%20reply%20left.%20sync%20reply%20left.%20sync%20reply%20left.%20sync%20reply%20left.%20sync%20reply%20left.%20sync%20reply%20left.%20sync%20reply%20left.%20,ra;m7,o1,o4,async%20reply%20left,ra;m5,o1,o2,sync;m6,o1,o2,async%20async%20async%20async%20async%20async,a;m10,o1,o2,sync%20reply.%20sync%20reply.%20sync%20reply.%20sync%20reply.%20sync%20reply.%20sync%20reply.%20sync%20reply.%20sync%20reply.%20sync%20reply.%20sync%20reply.%20sync%20reply.%20sync%20reply.%20sync%20reply.%20,r;m8,o1,o2,async%20reply,ra;m11,o3,o3,sync;m12,o3,o3,async%20async,a;m13,o3,o3,sync%20reply%20sync%20reply%20sync%20reply%20sync%20reply%20,r;m14,o3,o3,async%20reply%20async%20reply%20async%20reply%20async%20reply%20async%20reply%20async%20reply%20async,ra;m16,o3,o5,sendMessage()');
    sleepIfHumanObserver(15);
    return assertFragment(url);
});

test('Warn that touch input is not supported yet, and dismiss it', async () => {
    // Pretend we got a "pure" link to the site i.e. without any URL fragment
    await goTo('');
    await assertFragment('o1,Foo;o2,Bar;m1,o1,o2,Baz');
    await driver.touchActions().tap(findElementByText('Foo')).perform();
    const touchHintText = 'Touch input is not supported yet';
    await waitForElement(touchHintText);
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    return reversePromise(waitForElement(touchHintText));
});

test('MANUAL: Drag and drop Object remove button shall not select any text', () => {
    goTo('o1,MANUAL%3A%20Drag%20and%20drop%20the%20remove%20button%20of%20this%20object%20(but%20don\'t%20trigger%20a%20click).%20No%20text%20shall%20be%20selected.');
    return sleepIfHumanObserver(7);
});

test('ensure devMode == false', () => {
    // We don't want to deploy in dev mode...
    expect(devMode).toBeFalsy();
});

test('MANUAL: Controls are removed when a message is pending', () => {
    goTo('o1,Foo;o2,Bar;m1,o1,o2,MANUAL%20TEST%3A%201.%20Click%20any%20lifeline%20to%20create%20a%20pending%20message.%20Expected%3A%20The%20controls%20for%20this%20message%20shall%20not%20be%20displayed%20when%20hovered%20because%20it%20makes%20the%20UI%20nosiy%20and%20distracting.');
    return sleepIfHumanObserver(7);
});

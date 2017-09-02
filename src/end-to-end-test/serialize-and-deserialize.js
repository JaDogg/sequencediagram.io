// Parsing edge cases

test("extra semicolons are handled", async () => {
  await goTo(";o1,Foo;;;;;;;o2,Bar;;m1,o1,o2,baz();;");
  return assertFragment("o1,Foo;o2,Bar;m1,o1,o2,baz()");
});

test("random garbage is handled", async () => {
  await goTo("sdkfj haiw3h rp9yefIUAFGO/A#Ryq8o37ry eöiHF FHP)F(YWP)¤r8yDF");
  return assertFragment("");
});

test("missing components are handled", async () => {
  await goTo(
    "o1;o2,;m1;m2,;m3,a;m3,o1;m4,o1,a;m5,o1,o2,;o100,Valid;o3Invalid;o101,Alsovalid;m6,o100,o101,Valid;m10,o101,o100,"
  );
  return assertFragment("o100,Valid;o101,Alsovalid;m6,o100,o101,Valid");
});

test("messages with invalid references are not included in deserialization", async () => {
  await goTo("'o1,Foo;o2,Bar;m1,o1,o2,Baz'");
  await click("Bar");
  await typeAndConfirmm("NoBoom");
  return assertFragment("o2,NoBoom");
});

test("invalid message references do not crash", async () => {
  await goTo("o1,Foo;o3,Baz;m2,o2,o3,bar()");
  await click("Foo");
  await typeAndConfirmm("NoBoom");
  return assertFragment("o1,NoBoom;o3,Baz");
});

test("Can have unicode arrow in message and object name", async () => {
  const toAssert =
    "o1,%E2%87%90;o2,Unicode%20arrows%20ftw;m1,o1,o2,%E2%87%90%20plus%20text";
  await goTo(
    "o1,%E2%87%90;o2,Unicode%20arrows%20ftw;m1,o1,o2,%E2%87%90%20plus%20text"
  );
  await assertFragment(toAssert);
  await goTo("o1,⇐;o2,Unicode%20arrows%20ftw;m1,o1,o2,⇐%20plus%20text");
  return assertFragment(toAssert);
});

/*TODO
test('double object ids', () => {
    goTo('o1,First;o1,Duplicate');
});
*/

// TODO: negative ids are handled i.e. ignored

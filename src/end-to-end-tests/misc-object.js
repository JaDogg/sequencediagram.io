it('change object name', async () => {
  await goTo('o1,ChangeMyName');
  await clickAndType(driver, 'ChangeMyName', 'NewText');
  return assertFragment('o1,NewText');
});

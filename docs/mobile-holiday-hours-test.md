# Holiday hours mobile smoke test

1. Send `Holiday hours`.
2. Reply with a holiday number.
3. Verify choices: Closed / Normal business hours / Special hours / Back.
4. Verify Normal resolves the weekday's clinic hours.
5. Verify Special asks only for `HH:MM-HH:MM`.
6. Verify completion returns a concise confirmation.
7. Verify `MENU` exits the guided flow.

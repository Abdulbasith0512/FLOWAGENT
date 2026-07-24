# Local troubleshooting

## The app does not start

- Confirm dependencies are installed.
- Confirm the `.env` file exists and contains the required values.
- Confirm Docker is running if you are using the local database stack.

## A workflow run fails

- Check the backend logs.
- Check the worker logs.
- Re-run the workflow with a small sample input.

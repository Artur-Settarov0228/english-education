import os
from django.core.management.base import BaseCommand
from django.conf import settings
from google_auth_oauthlib.flow import InstalledAppFlow

class Command(BaseCommand):
    help = 'Runs the OAuth 2.0 flow to authorize YouTube Uploads and generates token.json.'

    def handle(self, *args, **options):
        credentials_path = getattr(settings, 'YOUTUBE_CREDENTIALS_FILE', None)
        token_path = getattr(settings, 'YOUTUBE_TOKEN_FILE', None)

        if not credentials_path or not os.path.exists(credentials_path):
            self.stdout.write(
                self.style.ERROR(
                    f"Google API Client credentials file not found at: '{credentials_path}'. "
                    f"Please download it from Google Cloud Console and place it in the config directory."
                )
            )
            return

        # Define the scope needed for uploading videos
        scopes = ['https://www.googleapis.com/auth/youtube.upload']

        # Ensure the output directory for token.json exists
        token_dir = os.path.dirname(token_path)
        if not os.path.exists(token_dir):
            os.makedirs(token_dir)

        self.stdout.write("Initializing authentication flow...")
        flow = InstalledAppFlow.from_client_secrets_file(credentials_path, scopes)

        # Runs a local server to complete the authorization code flow.
        # In headless production servers, the link printed in the console can be used.
        try:
            # We set bind_addr to '0.0.0.0' or just run it with default local server options
            # run_local_server works by printing a URL if it cannot open a browser automatically.
            creds = flow.run_local_server(
                port=0, 
                prompt='consent',
                authorization_prompt_message='Please open this URL in your browser to authorize: {url}'
            )

            # Save credentials to token.json
            with open(token_path, 'w') as token_file:
                token_file.write(creds.to_json())

            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully authenticated. Saved token file to: {token_path}"
                )
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(
                    f"Failed to complete OAuth authorization flow: {str(e)}"
                )
            )

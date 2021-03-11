# serverless_ad_decision_service

Workshop Overview 

We will cover this workshop in two modules :

1. Module 1 covers how to monetize Live content using VAST tags
2. Module 2 covers how to monetize VOD content using VMAP tags



Assumptions:

You already have :

1. *${LIVE_SOURCE}* : Source which will stream your live content with or without SCTE-35 Markers.
    1. In this case we are providing you with the live source URL.
    2. https://d1wil155oo1tnj.cloudfront.net/out/v1/1237241bc90c412fab48edbb7e3747b9/index.m3u8
    3. So wherever you see ${LIVE_SOURCE}, use above URL or URL of your live source
2. *${VOD_SOURCE}* : Source which will stream your VOD media contents. 
    1. In this case we are providing you with the VOD source URL.
    2. https://ftc-vod-ingest-videos-002826676743-us-east-1.s3.amazonaws.com/converted/HLS.m3u8
    3. So wherever you see ${VOD_SOURCE}, use above URL or URL of your VOD source
3. *${AD_TAG}*: Vast tag from your ad decision server 
    1. In this case, we are providing you with a sample VAST tag available in public.  
    2. https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dlinear&correlator=[avail.random]  
    3. This tag is only for reference, we wont be using this tag in workshop. But wherever ${AD_TAG} is mentioned you can use your tag for monetization.



Demo

https://ftc-vod-ingest-videos-002826676743-us-east-1.s3.amazonaws.com/input/Demo.mov


Architecture

[Image: Screenshot 2021-03-06 at 1.19.49 PM.png]
Workshop Lab

*Step 1: Create IDE*

All development needs some an IDE. So instead setting up our environment on local machine, lets consume AWS Cloud9 - a browser based IDE which comes pre-installed with SAM, Nodejs, Python, AWS CLI etc.

Instructions

1. Open AWS console and go to AWS Cloud9 console (https://console.aws.amazon.com/cloud9/home?region=us-east-1). Follow steps below which are also demonstrated in image.
2. Click *Create environment* button.
3. Enter name - *IndiaSummitIDE*. Leave description empty and click *Next step*.
4. In next page, Leave rest of the details default and click *Next Step*. 
5. In next page, review the details and click *Create environment*.


[Image: Cloud9.gif]

It will take 30 seconds to 1 minute for your IDE to launch. So please proceed to Next steps. 



*Step 2: Create Ad Inventory*

This step we will upload all the ads/promos/videos in to an S3 bucket. This will act as your ad inventory which will be inserted in live and VOD streams.

Instructions

1. Download the ad videos from this link (https://summit-ads.s3.amazonaws.com/ads_video_assets.zip), unzip it and save videos to your desktop. 
2. It should contain 5 video files (Do not rename any videos) 
3. Open the Amazon S3 console at https://console.aws.amazon.com/s3/. 
4. Click *Create bucket*. 
5. The *Create bucket* wizard will now open. In Bucket name, enter the name as ad-media-[event-hash].  Where the event-hash is a unique id that you/team were provided for this workshop.

For example: if my event hash was *abcd-0123456789-ef*, the bucket name that I create will be ad-media-*abcd-0123456789-ef*

*Note: The bucket name must be unique across all of Amazon S3. Hence we have used the hash id.*

1. Leave rest of the entries as it is and click on '*Create Bucket*'. Now the bucket you created will be listed.
2. From the Buckets list, choose the bucket and click on bucket name.
3. Drag and drop the ad files to this screen to Upload files. Then Click on Upload.
4. Amazon S3 now uploads your objects and folders. When the upload completes, you can see a success message on the *Upload: status page*. click on “Close: to close the success dialog

The animation below shows the above process. 

[Image: UploadtoS31.gif]

1. We need to make this AD inventory available over internet to insert them into a video stream. Follow below steps for same:
    1. Now click on “permissions” tab in your bucket  
        1. Under header “Block public access (bucket settings)”
        2. click on edit
        3. Uncheck “*Block all public access*” and click on save changes.
    2. Now select all files by clicking on checkbox beside name
        1. Click on “Actions”, which will open a drop down
        2. Select “make public” and then click on button “Make public”.
        3. Close the dialog once we see a success message. 



*Step 3: Create Dummy Server-less Ad Decision Service*

In order to insert Ads to your stream we need a component who will take decision on which AD should be inserted. i.e an AD Decision Service or ADS. AWS Elemental Mediatailor (*AEMT*) will get he advertisements from ADS and stitch it to your video streams.  AEMT support almost all ADS who adhere to specifications from IAB. (Interactive Advertising Bureau)

 Once you setup your ADS, you will get a ad tag which can be configured on AEMT. So if you have a ${AD_TAG}, then you can use same. Since we are assuming we don’t have one, will create a Dummy ADS which will give us a url which can be used as our tag.


 Instructions

1. Go back to AWS Cloud9 console (https://console.aws.amazon.com/cloud9/home?region=us-east-1) 
2. Locate IDE created in Step 1 (*IndiaSummitIIDE*) and click on “Open IDE” - Button
3. Once the IDE is launched, go the terminal 
    (It should be open at bottom of IDE, else click on “+” button and select terminal)
4. Run bellow command 
5. git clone https://github.com/ggn/serverless_ad_decision_service.git
    
    cd serverless_ad_decision_service
6. On Left panel, you can see all folders and files. 
7. Open folder “serverless_ad_decision_service”  and open file template.yml
8. This is a YAML file. Search for “Environment”. Under Environment there will be many variable.
    Edit variable with below data. Replace  {{YOUR_BUCKET_NAME}} with your S3 bucket name created in step 2.
9. NODE_ENV: production
    OVERRIDE_ADS: 1
    AD_URL : 'https://{{YOUR_BUCKET_NAME}}.s3.amazonaws.com/'
    VAST_URl : '{{YOUR_API_ENDPOINT}}'
10. You can Leave YOUR_API_ENDPOINT as-is. will replace it when we work with our VOD setup
11. Now type in the following commands in terminal to deploy the ADS. 
12. sam build
    
    sam deploy --guided --capabilities CAPABILITY_NAMED_IAM
    Stack Name : adserver
        [For reset press enter for defaults, refer below image]
    You may encounter a statement like below, then select 'y' 
        *HelloWorld may not have authorization defined, Is this okay? [y/N]: y*
    This is because we are not providing any explicit permissions to our APIs '*/**live'* and '*/vod*'    
        
13. [Image: image.png]


This will deploy an API Gateway and Lambda that acts as a simple ADS. There are two endpoints that this template creates: */live* endpoint, which returns a VAST XML response. and */vod* endpoint which returns a vmap xml response.

If all goes well, you will see an endpoint as given below. 
Copy endpoint URL from terminal (highlighted below as value) and keep it handy for next steps. 
This is YOUR_API_ENDPOINT
[Image: sam_deploy.PNG]
Now test if the deployment has been successful by executing the below command in terminal

curl YOUR_API_ENDPOINT/live


This should return a response as below. We will be using this endpoint for our live video ad insertion purposes. 

<VAST xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="vast.xsd" version="3.0">
  <Ad id="1999" sequence="99">
    <InLine>
      <AdSystem version="1.0">SABS Ad Server</AdSystem>
      <AdTitle>SABS</AdTitle>
      <Description/>
      <Survey/>
      <Error>
        <![CDATA[http://error.err]]>
      </Error>
      <Impression id="500">https://qkiipps372.execute-api.us-east-1.amazonaws.com/prod/sabs-ads</Impression>
      <Impression id="sample-server">https://qkiipps372.execute-api.us-east-1.amazonaws.com/prod/sabs-ads</Impression>
      <Creatives>
        <Creative id="199200">
          <Linear>
            <Duration>00:20:00</Duration>
            <TrackingEvents>
              <Tracking event="creativeView">https://qkiipps372.execute-api.us-east-1.amazonaws.com/prod/sabs-ads</Tracking>
            </TrackingEvents>
            <VideoClicks>
              <ClickThrough id="">https://qkiipps372.execute-api.us-east-1.amazonaws.com/prod/sabs-ads</ClickThrough>
            </VideoClicks>
            <MediaFiles>
              <MediaFile id="GDFP" delivery="progressive" width="640" height="360" type="video/mp4" bitrate="118" scalable="true" maintainAspectRatio="true">https://YOUR_S3_REPO/billpay.mp4</MediaFile>
            </MediaFiles>
          </Linear>
        </Creative>
        <Creative>
          <CompanionAds>
            <Companion width="300" height="250">
              <StaticResource creativeType="image/jpeg">http://companionad.com/image.jpg</StaticResource>
              <TrackingEvents>
                <Tracking event="creativeView">http://companionad.com/creativeView</Tracking>
              </TrackingEvents>
            </Companion>
          </CompanionAds>
        </Creative>
      </Creatives>
    </InLine>
  </Ad>
</VAST>



*Step 4: Setup SSAI for live content*

Test your live stream url (i.e *${LIVE_SOURCE})* in  JW Player Stream Tester (https://developer.jwplayer.com/tools/stream-tester/). 
In our case, live url : https://d1wil155oo1tnj.cloudfront.net/out/v1/1237241bc90c412fab48edbb7e3747b9/index.m3u8
Now we have all required components, so lets configure AEMT:


Instructions

1. Open the Amazon AWS Elemental Media Tailor console at https://console.aws.amazon.com/mediatailor/ (https://console.aws.amazon.com/s3/). 
2. Click on  *Create Configuration*. 
3. Under *Configuration name* input “IndiaSummitLive”
4. Under *Video content* source input add your *${LIVE_SOURCE} URL without manifest name (without index.m3u8). Our case use below url*

https://d1wil155oo1tnj.cloudfront.net/out/v1/1237241bc90c412fab48edbb7e3747b9/ (https://d1wil155oo1tnj.cloudfront.net/out/v1/1237241bc90c412fab48edbb7e3747b9/%E2%80%9D)

1. Under *Ad Decision Server* input 
2. YOUR_API_ENDPOINT/live?correlation=[session.id]&gender=[player_params.gender]&geo=[player_params.geo]


[Image: MediaTailorLive.png]

1. Open “*Personalization details*” tab and under “Live pre-roll ad decision server” Input same :
2. YOUR_API_ENDPOINT/live?correlation=[session.id]&gender=[player_params.gender]&geo=[player_params.geo]


[Image: image.png]


1. Click *Create configuration* 
2. Navigate back to the MediaTailor dashboard.
3. Open your MediaTailor Configuration

Note* You should see your configuration displayed in the table on screen. Next to it you will see the *Playback endpoints* (it may take a few minutes to propagate)

1. Copy the *HLS Playback Prefix*
2. To play the content, paste the appended playback URL and append “*index.m3u8*” into either the Safari browser or to the JW Player Stream Tester (https://developer.jwplayer.com/tools/stream-tester/) (https://developer.jwplayer.com/tools/stream-tester/)Your link should look something like this:  https://<HLS_Playback_URL>index.m3u8 (https://7e7ccbfb4c05400696da27a06cbbe888.mediatailor.us-east-1.amazonaws.com/v1/master/1ff1c90ae6fbc558a1f7f1c4631ee0ff55fcb49b/summit_live/index.m3u8)



Note* The first time the content is served, you may not see ads due to the “On-the-Fly” transcode video normalization.  Once the ads have been transcoded and stored in cache, you will view the media file with the advertisements inserted at the start.




*Step 5: Setup SSAI for live content (OPTIONAL)*

This is optional step, it's similar to live setup with below changes. 

Test your live stream url (i.e *${VOD_SOURCE})* in  JW Player Stream Tester (https://developer.jwplayer.com/tools/stream-tester/). 
In our case, vod url : https://ftc-vod-ingest-videos-002826676743-us-east-1.s3.amazonaws.com/converted/HLS.m3u8

Now Refer step 3 for making changes to your code again, update the below env variable and build and deploy the code:  

VAST_URl : '{{YOUR_API_ENDPOINT}}'

Now test if the deployment has been successful by executing the below command in terminal
curl YOUR_API_ENDPOINT/vod
This will return a response as below. We will be using this in our VOD ad insertion purposes. 

<vmap:VMAP xmlns:vmap="http://www.iab.net/videosuite/vmap" version="1.0">
 <vmap:AdBreak timeOffset="start" breakType="linear" breakId="preroll">
  <vmap:AdSource id="preroll-ad-1" allowMultipleAds="false" followRedirects="true">
   <vmap:AdTagURI templateType="vast3">
    <![CDATA[https://tbbnb0dpm9.execute-api.us-east-1.amazonaws.com/Prod/live/]]>
   </vmap:AdTagURI>
  </vmap:AdSource>
 </vmap:AdBreak>
 <vmap:AdBreak timeOffset="00:00:30.000" breakType="linear" breakId="midroll-1">
  <vmap:AdSource id="midroll-1-ad-1" allowMultipleAds="false" followRedirects="true">
   <vmap:AdTagURI templateType="vast3">
    <![CDATA[https://tbbnb0dpm9.execute-api.us-east-1.amazonaws.com/Prod/live/]]>
   </vmap:AdTagURI>
  </vmap:AdSource>
 </vmap:AdBreak>
 <vmap:AdBreak timeOffset="end" breakType="linear" breakId="postroll">
  <vmap:AdSource id="postroll-ad-1" allowMultipleAds="false" followRedirects="true">
   <vmap:AdTagURI templateType="vast3">
    <![CDATA[https://tbbnb0dpm9.execute-api.us-east-1.amazonaws.com/Prod/live/]]>
   </vmap:AdTagURI
  </vmap:AdSource>
 </vmap:AdBreak>
</vmap:VMAP>

Now we have all required components, so lets configure AEMT:

1. Follow the pre-requisites section. You can skip this step if already done. Now that the custom ADS is created, it's time to add MediaTailor to the workflow.
2. Open the Amazon AWS Elemental Media Tailor console at https://console.aws.amazon.com/mediatailor/ (https://console.aws.amazon.com/s3/). 
3. Click *Create Configuration*. 
4. Under *Configuration name* input “SummitVOD”
5. Under *Video content* source input  with out file name i.e HLS.m3u8

https://ftc-vod-ingest-videos-002826676743-us-east-1.s3.amazonaws.com/converted/ (https://ftc-vod-ingest-videos-002826676743-us-east-1.s3.amazonaws.com/converted/HLS.m3u8)

1. Under *Ad Decision Server* input 

1. YOUR_API_ENDPOINT/vod?correlation=[session.id]&gender=[player_params.gender]&geo=[player_params.geo]


[Image: image.png]

1. Click *Create configuration* 
2. Navigate back to the MediaTailor dashboard.
3. Click on the link for your MediaTailor Configuration

Note* You should see your configuration displayed in the table on screen. Next to it you will see the *Playback endpoints* (it may take a few minutes to propagate)

1. Open configuration and copy the *HLS Playback Prefix*
2. To play the content, paste the appended playback URL and append “HLS.m3u8” into either the Safari browser or to the JW Player Stream Tester (https://developer.jwplayer.com/tools/stream-tester/) (https://developer.jwplayer.com/tools/stream-tester/)Your link should look something like this:  https://<HLS_Playback_URL>/summit_vod/HLS.m3u8 (https://7e7ccbfb4c05400696da27a06cbbe888.mediatailor.us-east-1.amazonaws.com/v1/master/1ff1c90ae6fbc558a1f7f1c4631ee0ff55fcb49b/summit_live/index.m3u8)



Note* The first time the content is served, you may not see ads due to the “On-the-Fly” transcode video normalization.  Once the ads have been transcoded and stored in cache, you will view the media file with the advertisements inserted at the start.



*Step 6: Clean Up*


You will have to follow these steps to ensure cleanup

Empty S3 bucket and Delete same  
Delete CF template launched by SAM
Delete MediaTailor Configurations

